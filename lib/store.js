// 인메모리 게임 상태 저장소 (MVP용 — 서버 재시작 시 초기화됨)
const rooms = globalThis.__galticponRooms ?? (globalThis.__galticponRooms = new Map());

const TEXT_SECONDS = 60; // 제시어 작성/맞히기 제한시간
const IMAGE_SECONDS = 120; // 그림 그리기(프롬프트+생성) 제한시간

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function randomCode(len = 4) {
  let s = '';
  for (let i = 0; i < len; i++) {
    s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return s;
}

function randomId() {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}

export function createRoom(nickname) {
  let code;
  do {
    code = randomCode();
  } while (rooms.has(code));

  const hostId = randomId();
  const room = {
    code,
    status: 'lobby', // lobby | playing | finished
    players: [{ id: hostId, nickname, isHost: true }],
    order: [], // 셔플된 플레이어 id — 체인 j는 라운드 r에 order[(j+r)%n]이 담당
    chains: [], // chains[j] = [{ type, text?, prompt?, url?, authorId, authorNickname }]
    round: 0,
    totalRounds: 0,
    roundEndsAt: 0,
    submissions: new Map(), // playerId -> { submitted, text?, prompt?, url? }
    createdAt: Date.now(),
  };
  rooms.set(code, room);
  return { room, playerId: hostId };
}

export function getRoom(code) {
  return rooms.get(String(code).toUpperCase()) ?? null;
}

export function joinRoom(code, nickname) {
  const room = getRoom(code);
  if (!room) return { error: '방을 찾을 수 없습니다.' };
  if (room.status !== 'lobby') return { error: '이미 게임이 시작된 방입니다.' };
  if (room.players.length >= 10) return { error: '방이 가득 찼습니다. (최대 10명)' };

  const playerId = randomId();
  room.players.push({ id: playerId, nickname, isHost: false });
  return { room, playerId };
}

export function startGame(room, playerId) {
  const player = room.players.find((p) => p.id === playerId);
  if (!player?.isHost) return { error: '방장만 시작할 수 있습니다.' };
  if (room.status !== 'lobby') return { error: '이미 시작된 게임입니다.' };

  const order = room.players.map((p) => p.id);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  room.order = order;
  room.chains = order.map(() => []);
  // 제시어 하나당 전원이 한 번씩 기여하면 끝 (4명: 제시-그림-제시-그림)
  // 1인 테스트 모드만 예외로 2라운드 진행
  room.totalRounds = order.length === 1 ? 2 : order.length;
  room.status = 'playing';
  beginRound(room, 0);
  return {};
}

export function roundType(round) {
  return round % 2 === 0 ? 'text' : 'image';
}

function beginRound(room, round) {
  room.round = round;
  room.submissions = new Map();
  const secs = roundType(round) === 'image' ? IMAGE_SECONDS : TEXT_SECONDS;
  room.roundEndsAt = Date.now() + secs * 1000;
}

// 라운드 r에서 플레이어가 담당하는 체인: order 인덱스 k → (k - r) mod n
export function chainIndexFor(room, playerId) {
  const n = room.order.length;
  const k = room.order.indexOf(playerId);
  if (k < 0) return -1;
  return (((k - room.round) % n) + n) % n;
}

export function getSubmission(room, playerId) {
  return room.submissions.get(playerId) ?? null;
}

export function setSubmission(room, playerId, data) {
  const prev = room.submissions.get(playerId) ?? {};
  room.submissions.set(playerId, { ...prev, ...data });
}

// 전원 제출 또는 제한시간 만료 시 라운드를 확정하고 다음으로 진행
export function maybeAdvance(room) {
  if (room.status !== 'playing') return;
  const allSubmitted = room.players.every((p) => room.submissions.get(p.id)?.submitted);
  const timedOut = Date.now() >= room.roundEndsAt;
  if (!allSubmitted && !timedOut) return;

  const type = roundType(room.round);
  for (const p of room.players) {
    const j = chainIndexFor(room, p.id);
    const sub = room.submissions.get(p.id) ?? {};
    if (type === 'text') {
      room.chains[j].push({
        type: 'text',
        text: (sub.text ?? '').trim() || '(미제출)',
        authorId: p.id,
        authorNickname: p.nickname,
      });
    } else {
      room.chains[j].push({
        type: 'image',
        url: sub.url ?? null,
        prompt: (sub.prompt ?? '').trim(),
        authorId: p.id,
        authorNickname: p.nickname,
      });
    }
  }

  if (room.round + 1 >= room.totalRounds) {
    room.status = 'finished';
  } else {
    beginRound(room, room.round + 1);
  }
}
