import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createServer as createHttpServer } from 'node:http';
import { WebSocket } from 'ws';
import { createGameServer } from '../app';
import { cancelLeave, RECONNECT_GRACE_MS } from '../lib/realtime';
import { deleteRoom, getRoom } from '../lib/store';

let server;
let port;
let baseUrl;
const createdCodes: string[] = [];
const wsClients: WebSocket[] = [];
const savedEnv: Record<string, string | undefined> = {};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function post(path, body?: Record<string, any>) {
  const res = await fetch(`${baseUrl}/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  return { status: res.status, data: await res.json() };
}

async function get(path) {
  const res = await fetch(`${baseUrl}/api${path}`);
  return { status: res.status, data: await res.json().catch(() => null), res };
}

async function createRoomHttp(nickname = '방장', body: Record<string, any> = {}) {
  const { status, data } = await post('/rooms', { nickname, ...body });
  expect(status).toBe(200);
  createdCodes.push(data.code);
  cancelLeave(data.code, data.playerId);
  return data;
}

async function joinHttp(code, nickname, password?: string) {
  const result = await post(`/rooms/${code}/join`, { nickname, password });
  if (result.data.playerId) cancelLeave(code, result.data.playerId);
  return result;
}

function openWs(code, playerId) {
  const ws = new WebSocket(`ws://127.0.0.1:${port}/ws?code=${code}&playerId=${playerId}`);
  wsClients.push(ws);
  return new Promise<WebSocket>((resolve, reject) => {
    ws.once('open', () => resolve(ws));
    ws.once('error', reject);
  });
}

function waitForMessage(ws, predicate, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('ws message timeout')), timeoutMs);
    ws.on('message', (raw) => {
      const msg = JSON.parse(String(raw));
      if (predicate(msg)) {
        clearTimeout(timer);
        resolve(msg);
      }
    });
  });
}

beforeAll(async () => {
  for (const key of ['AI_SERVER_URL', 'AI_SERVER_KEY', 'AI_SERVER_SECRET']) {
    savedEnv[key] = process.env[key];
    delete process.env[key];
  }
  server = createGameServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  for (const ws of wsClients) {
    try {
      ws.terminate();
    } catch {}
  }
  await new Promise((resolve) => {
    server.close(resolve);
    server.closeAllConnections?.();
  });
  clearInterval(globalThis.__gpTicker);
  globalThis.__gpTicker = undefined;
  const timers = globalThis.__gpLeaveTimers;
  if (timers) {
    for (const timer of timers.values()) clearTimeout(timer);
    timers.clear();
  }
  for (const code of createdCodes) deleteRoom(code);
  for (const [key, value] of Object.entries(savedEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe('방 생성과 조회', () => {
  it('POST /api/rooms → code/playerId, 목록·info·state 조회', async () => {
    const { code, playerId } = await createRoomHttp();
    expect(code).toMatch(/^[A-Z0-9]{4}$/);
    expect(playerId).toBeTruthy();
    const list = await get('/rooms');
    expect(list.status).toBe(200);
    expect(list.data.rooms.map((r) => r.code)).toContain(code);
    const info = await get(`/rooms/${code}/info`);
    expect(info.data).toMatchObject({ code, status: 'room', playerCount: 1, isPublic: true });
    const state = await get(`/rooms/${code}/state?playerId=${playerId}`);
    expect(state.status).toBe(200);
    expect(state.data.you.nickname).toBe('방장');
    expect(state.data.players[0].you).toBe(true);
    expect(JSON.stringify(state.data)).not.toContain(playerId);
  });

  it('없는 방 조회는 404', async () => {
    const missing = await get('/rooms/ZZZZ/state');
    expect(missing.status).toBe(404);
    expect(missing.data.error).toBe('errRoomNotFound');
  });

  it('닉네임 없이 방을 만들면 400', async () => {
    const result = await post('/rooms', {});
    expect(result.status).toBe(400);
    expect(result.data.error).toBe('errNickname');
  });
});

describe('입장', () => {
  it('join하면 playerId를 받고 인원이 늘어난다', async () => {
    const room = await createRoomHttp();
    const joined = await joinHttp(room.code, '손님');
    expect(joined.status).toBe(200);
    expect(joined.data.playerId).toBeTruthy();
    const info = await get(`/rooms/${room.code}/info`);
    expect(info.data.playerCount).toBe(2);
  });

  it('비번방은 틀린 비번이면 400 errWrongPassword', async () => {
    const room = await createRoomHttp('방장', { password: '비밀1234' });
    const fail = await joinHttp(room.code, '손님', '틀린비번');
    expect(fail.status).toBe(400);
    expect(fail.data.error).toBe('errWrongPassword');
    const ok = await joinHttp(room.code, '손님', '비밀1234');
    expect(ok.status).toBe(200);
  });
});

describe('config / start / submit / guess', () => {
  it('config는 방장만, start는 인원 검사를 거친다', async () => {
    const host = await createRoomHttp();
    const guest = await joinHttp(host.code, '손님');
    const notHost = await post(`/rooms/${host.code}/config`, { playerId: guest.data.playerId, patch: { mode: 'speed' } });
    expect(notHost.status).toBe(400);
    expect(notHost.data.error).toBe('errHostOnly');
    const ok = await post(`/rooms/${host.code}/config`, { playerId: host.playerId, patch: { mode: 'imposter' } });
    expect(ok.status).toBe(200);
    const short = await post(`/rooms/${host.code}/start`, { playerId: host.playerId });
    expect(short.status).toBe(400);
    expect(short.data.error).toBe('errNotEnoughPlayers');
  });

  it('시작 전 submit/guess는 errNotPlaying', async () => {
    const host = await createRoomHttp();
    const submit = await post(`/rooms/${host.code}/submit`, { playerId: host.playerId, text: '문장' });
    expect(submit.status).toBe(400);
    expect(submit.data.error).toBe('errNotPlaying');
    const guess = await post(`/rooms/${host.code}/guess`, { playerId: host.playerId, text: '정답' });
    expect(guess.status).toBe(400);
    expect(guess.data.error).toBe('errNotPlaying');
  });

  it('채팅은 게임 중에만 되고 누구나 자유롭게 보낼 수 있다', async () => {
    const host = await createRoomHttp();
    const guest = await joinHttp(host.code, '손님1');
    await joinHttp(host.code, '손님2');
    const early = await post(`/rooms/${host.code}/chat`, { playerId: host.playerId, text: '안녕' });
    expect(early.status).toBe(400);
    expect(early.data.error).toBe('errNotPlaying');

    await post(`/rooms/${host.code}/config`, { playerId: host.playerId, patch: { mode: 'imposter' } });
    await post(`/rooms/${host.code}/start`, { playerId: host.playerId });
    const game = getRoom(host.code).game;

    const sent = await post(`/rooms/${host.code}/chat`, { playerId: host.playerId, text: '누가 수상해?' });
    expect(sent.status).toBe(200);

    const crew = game.order.find((id) => id !== game.imposterId);
    const keywordChat = await post(`/rooms/${host.code}/chat`, { playerId: crew, text: `혹시 ${game.keyword.ko}?` });
    expect(keywordChat.status).toBe(200);

    const empty = await post(`/rooms/${host.code}/chat`, { playerId: host.playerId, text: '   ' });
    expect(empty.status).toBe(400);
    expect(empty.data.error).toBe('errEmptyText');

    const state = await get(`/rooms/${host.code}/state?playerId=${guest.data.playerId}`);
    expect(state.data.game.chat).toHaveLength(2);
    expect(state.data.game.chat[0]).toEqual({ nickname: '방장', text: '누가 수상해?', you: false });
    expect(state.data.minPlayers).toBe(3);
  });

  it('imposter 한 판: 차례 → 투표 → 지목 → 추리', async () => {
    const host = await createRoomHttp();
    await joinHttp(host.code, '손님1');
    await joinHttp(host.code, '손님2');
    await post(`/rooms/${host.code}/config`, { playerId: host.playerId, patch: { mode: 'imposter' } });
    expect((await post(`/rooms/${host.code}/start`, { playerId: host.playerId })).status).toBe(200);

    const room = getRoom(host.code);
    const game = room.game;

    for (let i = 0; i < game.order.length; i++) {
      const pid = game.order[game.turn];
      expect((await post(`/rooms/${host.code}/generate`, { playerId: pid, prompt: `zzz${i}` })).status).toBe(200);
      expect((await post(`/rooms/${host.code}/submit`, { playerId: pid })).status).toBe(200);
    }
    expect(game.phase).toBe('vote');

    const selfVote = await post(`/rooms/${host.code}/vote`, { playerId: game.order[0], target: 0 });
    expect(selfVote.status).toBe(400);
    expect(selfVote.data.error).toBe('errCannotVoteSelf');

    const imposterIndex = game.order.indexOf(game.imposterId);
    const otherIndex = game.order.findIndex((id) => id !== game.imposterId);
    for (const id of game.order) {
      const target = id === game.imposterId ? otherIndex : imposterIndex;
      expect((await post(`/rooms/${host.code}/vote`, { playerId: id, target })).status).toBe(200);
    }
    expect(game.caught).toBe(true);
    expect(game.phase).toBe('guess');

    const crew = game.order.find((id) => id !== game.imposterId);
    const denied = await post(`/rooms/${host.code}/guess`, { playerId: crew, text: '아무거나' });
    expect(denied.status).toBe(400);
    expect(denied.data.error).toBe('errImposterOnly');

    const win = await post(`/rooms/${host.code}/guess`, { playerId: game.imposterId, text: game.keyword.ko });
    expect(win.status).toBe(200);
    expect(win.data.correct).toBe(true);
    expect(room.status).toBe('finished');
  });

  it('speed 한 라운드: 생성 전 추측 → 생성과 자동 제출 → 정답', async () => {
    const host = await createRoomHttp();
    const guest = await joinHttp(host.code, '손님');
    await post(`/rooms/${host.code}/config`, { playerId: host.playerId, patch: { mode: 'speed' } });
    const started = await post(`/rooms/${host.code}/start`, { playerId: host.playerId });
    expect(started.status).toBe(200);

    const hostState = await get(`/rooms/${host.code}/state?playerId=${host.playerId}`);
    const hostIsDrawer = hostState.data.game.youAreDrawer;
    const drawerId = hostIsDrawer ? host.playerId : guest.data.playerId;
    const guesserId = hostIsDrawer ? guest.data.playerId : host.playerId;
    const drawerState = await get(`/rooms/${host.code}/state?playerId=${drawerId}`);
    const keyword = drawerState.data.game.keyword;
    expect(keyword).toBeTruthy();

    const wrongTurn = await post(`/rooms/${host.code}/generate`, { playerId: guesserId, prompt: '평화로운 풍경' });
    expect(wrongTurn.status).toBe(400);
    expect(wrongTurn.data.error).toBe('errNotYourTurn');

    const empty = await post(`/rooms/${host.code}/generate`, { playerId: drawerId, prompt: '  ' });
    expect(empty.status).toBe(400);
    expect(empty.data.error).toBe('errEmptyPrompt');

    const banned = await post(`/rooms/${host.code}/generate`, { playerId: drawerId, prompt: `멋진 ${keyword.ko} 그림` });
    expect(banned.status).toBe(400);
    expect(banned.data.error).toBe('errBannedWord');

    const earlyWrong = await post(`/rooms/${host.code}/guess`, { playerId: guesserId, text: '완전 오답' });
    expect(earlyWrong.status).toBe(200);
    expect(earlyWrong.data.correct).toBe(false);

    const generated = await post(`/rooms/${host.code}/generate`, { playerId: drawerId, prompt: '평화로운 초원 풍경' });
    expect(generated.status).toBe(200);
    expect(generated.data.url).toMatch(/^\/api\/mock-image\?/);

    const stateAfterGeneration = await get(`/rooms/${host.code}/state?playerId=${guesserId}`);
    expect(stateAfterGeneration.data.game.phase).toBe('guess');
    expect(stateAfterGeneration.data.game.image).toBe(generated.data.url);

    const correct = await post(`/rooms/${host.code}/guess`, { playerId: guesserId, text: keyword.en });
    expect(correct.status).toBe(200);
    expect(correct.data.correct).toBe(true);

    const late = await post(`/rooms/${host.code}/guess`, { playerId: guesserId, text: keyword.en });
    expect(late.status).toBe(400);
    expect(late.data.error).toBe('errNotGuessPhase');
  });
});

describe('이미지', () => {
  it('생성 응답 전에 턴이 끝나면 늦게 도착한 이미지를 적용하지 않는다', async () => {
    let releaseResponse: (() => void) | undefined;
    let markRequested: (() => void) | undefined;
    const requested = new Promise<void>((resolve) => { markRequested = resolve; });
    const upstream = createHttpServer((req, res) => {
      req.resume();
      req.on('end', () => {
        markRequested?.();
        releaseResponse = () => {
          res.writeHead(200, { 'Content-Type': 'image/png' });
          res.end(Buffer.from('late-image'));
        };
      });
    });
    await new Promise<void>((resolve) => upstream.listen(0, '127.0.0.1', resolve));

    const previous = {
      url: process.env.AI_SERVER_URL,
      key: process.env.AI_SERVER_KEY,
      secret: process.env.AI_SERVER_SECRET,
    };
    const address = upstream.address();
    process.env.AI_SERVER_URL = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`;
    process.env.AI_SERVER_KEY = 'test-key';
    process.env.AI_SERVER_SECRET = 'test-secret';

    try {
      const host = await createRoomHttp();
      const guest1 = await joinHttp(host.code, '손님1');
      const guest2 = await joinHttp(host.code, '손님2');
      await post(`/rooms/${host.code}/config`, { playerId: host.playerId, patch: { mode: 'imposter' } });
      await post(`/rooms/${host.code}/start`, { playerId: host.playerId });
      const room = getRoom(host.code);
      const currentPlayerId = room.game.order[room.game.turn];

      const pending = post(`/rooms/${host.code}/generate`, { playerId: currentPlayerId, prompt: '느린 생성' });
      await requested;
      room.game.endsAt = Date.now() - 1;
      releaseResponse?.();

      const generated = await pending;
      expect(generated.status).toBe(409);
      expect(room.game.entries[0]).toMatchObject({ playerId: currentPlayerId, url: null, skipped: true });
      expect(room.game.draftUrl).toBeNull();
      expect(guest1.data.playerId).toBeTruthy();
      expect(guest2.data.playerId).toBeTruthy();
    } finally {
      if (previous.url === undefined) delete process.env.AI_SERVER_URL;
      else process.env.AI_SERVER_URL = previous.url;
      if (previous.key === undefined) delete process.env.AI_SERVER_KEY;
      else process.env.AI_SERVER_KEY = previous.key;
      if (previous.secret === undefined) delete process.env.AI_SERVER_SECRET;
      else process.env.AI_SERVER_SECRET = previous.secret;
      await new Promise<void>((resolve) => upstream.close(() => resolve()));
    }
  });

  it('AI env가 없으면 mock-image URL이 나오고 SVG가 서빙된다', async () => {
    const host = await createRoomHttp();
    await post(`/rooms/${host.code}/config`, { playerId: host.playerId, patch: { mode: 'coop' } });
    await post(`/rooms/${host.code}/start`, { playerId: host.playerId });
    const generated = await post(`/rooms/${host.code}/generate`, { playerId: host.playerId, prompt: '숲속 오두막' });
    expect(generated.data.url).toMatch(/^\/api\/mock-image\?/);
    const image = await fetch(`${baseUrl}${generated.data.url}`);
    expect(image.status).toBe(200);
    expect(image.headers.get('content-type')).toContain('image/svg+xml');
    const body = await image.text();
    expect(body.startsWith('<svg')).toBe(true);
  });

  it('없는 이미지 id는 404', async () => {
    const missing = await get('/image/no-such-image-id');
    expect(missing.status).toBe(404);
  });
});

describe('웹소켓', () => {
  it('상태가 바뀌면 state 메시지를 받는다', async () => {
    const room = await createRoomHttp('소켓방장');
    const ws = await openWs(room.code, room.playerId);
    const changed = waitForMessage(ws, (msg) => msg.type === 'state' && msg.state.name === '바뀐이름');
    await post(`/rooms/${room.code}/config`, { playerId: room.playerId, patch: { name: '바뀐이름' } });
    const msg: any = await changed;
    expect(msg.state.code).toBe(room.code);
    expect(JSON.stringify(msg.state)).not.toContain(room.playerId);
    ws.close();
  });
});

describe('재접속 유예', () => {
  it('ws 없이 만든 방은 유예 시간 후 사라진다', async () => {
    const { data } = await post('/rooms', { nickname: '유령방장' });
    createdCodes.push(data.code);
    const before = await get(`/rooms/${data.code}/state`);
    expect(before.status).toBe(200);
    await sleep(RECONNECT_GRACE_MS + 500);
    const after = await get(`/rooms/${data.code}/state`);
    expect(after.status).toBe(404);
  }, 15000);

  it('ws를 유지하면 방이 유지된다', async () => {
    const { data } = await post('/rooms', { nickname: '접속방장' });
    createdCodes.push(data.code);
    const ws = await openWs(data.code, data.playerId);
    await sleep(RECONNECT_GRACE_MS + 500);
    const state = await get(`/rooms/${data.code}/state`);
    expect(state.status).toBe(200);
    ws.close();
  }, 15000);
});
