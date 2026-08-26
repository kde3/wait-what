import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  advance,
  applyDraft,
  configRoom,
  createRoom,
  deleteRoom,
  guessAction,
  joinRoom,
  removePlayer,
  setTeam,
  startGame,
  submitAction,
} from '../lib/store';
import { buildState } from '../lib/serialize';

const codes: string[] = [];

function makeRoom(count = 1, opts: Record<string, any> = {}) {
  const { room, playerId } = createRoom('방장', opts);
  codes.push(room.code);
  const ids = [playerId];
  for (let i = 1; i < count; i++) ids.push(joinRoom(room.code, `손님${i}`).playerId);
  return { room, ids };
}

function timeout(room) {
  vi.useFakeTimers();
  vi.setSystemTime(room.game.endsAt + 1000);
  advance(room);
}

function expectNoIdLeak(room, ids) {
  for (const viewer of [...ids, '제3자없는id', undefined]) {
    const json = JSON.stringify(buildState(room, viewer));
    for (const id of ids) expect(json).not.toContain(id);
  }
}

afterEach(() => {
  vi.useRealTimers();
  for (const code of codes.splice(0)) deleteRoom(code);
});

describe('플레이어 id 비노출', () => {
  it('로비 상태 직렬화에 어떤 플레이어 id도 없다', () => {
    const { room, ids } = makeRoom(3);
    expectNoIdLeak(room, ids);
  });

  it('classic 진행/종료 직렬화에 어떤 플레이어 id도 없다', () => {
    const { room, ids } = makeRoom(2);
    startGame(room, ids[0]);
    submitAction(room, ids[0], { text: '문장' });
    expectNoIdLeak(room, ids);
    submitAction(room, ids[1], { text: '다른 문장' });
    ids.forEach((id, i) => {
      applyDraft(room, id, '프롬프트', `/api/mock-image?s=${i}`);
      expectNoIdLeak(room, ids);
      submitAction(room, id, {});
    });
    expect(room.status).toBe('finished');
    expectNoIdLeak(room, ids);
  });

  it('chaos 캐릭터는 모든 플레이어에게 동일하게 보이고 id는 노출되지 않는다', () => {
    const { room, ids } = makeRoom(3);
    configRoom(room, ids[0], { mode: 'chaos' });
    startGame(room, ids[0]);
    const states = ids.map((id) => buildState(room, id));
    expect(states.map((state) => state.game.chaosCharacterId)).toEqual([
      room.game.chaosCharacterId,
      room.game.chaosCharacterId,
      room.game.chaosCharacterId,
    ]);
    expectNoIdLeak(room, ids);
  });

  it('chaos 캐릭터는 게임 종료 결과까지 유지된다', () => {
    const { room, ids } = makeRoom();
    configRoom(room, ids[0], { mode: 'chaos' });
    startGame(room, ids[0]);
    const characterId = room.game.chaosCharacterId;

    vi.useFakeTimers();
    vi.setSystemTime(room.game.revealEndsAt + 1);
    advance(room);
    submitAction(room, ids[0], { text: '테스트 문장' });
    applyDraft(room, ids[0], '테스트 그림', 'data:image/png;base64,test');
    submitAction(room, ids[0], {});

    expect(room.status).toBe('finished');
    expect(buildState(room, ids[0]).results.chaosCharacterId).toBe(characterId);
    expectNoIdLeak(room, ids);
  });

  it('speed 진행/종료 직렬화에 어떤 플레이어 id도 없다', () => {
    const { room, ids } = makeRoom(2);
    configRoom(room, ids[0], { mode: 'speed', options: { rounds: 1 } });
    startGame(room, ids[0]);
    const g = room.game;
    const drawer = g.drawerId;
    const guesser = ids.find((id) => id !== drawer);
    applyDraft(room, drawer, '그림', 'url');
    expectNoIdLeak(room, ids);
    submitAction(room, drawer, {});
    guessAction(room, guesser, '완전 오답');
    expectNoIdLeak(room, ids);
    guessAction(room, guesser, g.keyword.ko);
    expectNoIdLeak(room, ids);
    timeout(room);
    expect(room.status).toBe('finished');
    expectNoIdLeak(room, ids);
  });

  it('speed_team 진행/종료 직렬화에 어떤 플레이어 id도 없다', () => {
    const { room, ids } = makeRoom(4);
    configRoom(room, ids[0], { mode: 'speed_team', options: { rounds: 1 } });
    setTeam(room, ids[0], 0);
    setTeam(room, ids[1], 0);
    setTeam(room, ids[2], 1);
    setTeam(room, ids[3], 1);
    startGame(room, ids[0]);
    const g = room.game;
    for (const t of [0, 1]) {
      applyDraft(room, g.drawers[t], `그림${t}`, `url-${t}`);
      submitAction(room, g.drawers[t], {});
    }
    expectNoIdLeak(room, ids);
    const guesser = room.players.find((p) => p.team === 0 && p.id !== g.drawers[0]).id;
    guessAction(room, guesser, g.keyword.ko);
    expectNoIdLeak(room, ids);
    timeout(room);
    expect(room.status).toBe('finished');
    expectNoIdLeak(room, ids);
  });

  it('coop 진행/종료 직렬화에 어떤 플레이어 id도 없다', () => {
    const { room, ids } = makeRoom(2);
    configRoom(room, ids[0], { mode: 'coop' });
    startGame(room, ids[0]);
    applyDraft(room, ids[0], '조각', 'url');
    submitAction(room, ids[0], {});
    expectNoIdLeak(room, ids);
    timeout(room);
    expect(room.status).toBe('finished');
    expectNoIdLeak(room, ids);
  });

  it('imposter 진행/종료 직렬화에 어떤 플레이어 id도 없다 (중퇴자 포함)', () => {
    const { room, ids } = makeRoom(4);
    configRoom(room, ids[0], { mode: 'imposter' });
    startGame(room, ids[0]);
    const g = room.game;
    const firstTurn = g.order[0];
    applyDraft(room, firstTurn, '프롬프트', 'url-0');
    submitAction(room, firstTurn, {});
    expectNoIdLeak(room, ids);
    const leaver = ids.find((id) => id !== g.imposterId && g.order.indexOf(id) > 0);
    removePlayer(room, leaver);
    advance(room);
    expectNoIdLeak(room, ids);
    while (room.status === 'playing' && g.phase === 'turns') {
      const pid = g.order[g.turn];
      if (room.players.some((p) => p.id === pid)) {
        applyDraft(room, pid, '프롬프트', `url-${g.turn}`);
        submitAction(room, pid, {});
      } else {
        advance(room);
      }
    }
    guessAction(room, g.imposterId, g.keyword.ko);
    expect(room.status).toBe('finished');
    expectNoIdLeak(room, ids);
  });
});

describe('you 표시', () => {
  it('players[].you는 요청자 본인에게만 true다', () => {
    const { room, ids } = makeRoom(3);
    startGame(room, ids[0]);
    for (const viewer of ids) {
      const state = buildState(room, viewer);
      const mine = state.players.filter((p) => p.you);
      expect(mine).toHaveLength(1);
      expect(mine[0].nickname).toBe(room.players.find((p) => p.id === viewer).nickname);
      expect(state.you.nickname).toBe(mine[0].nickname);
    }
    const stranger = buildState(room, '전혀없는id');
    expect(stranger.players.every((p) => !p.you)).toBe(true);
    expect(stranger.you).toBeNull();
  });
});

describe('imposter 공개 범위', () => {
  it('진행 중에는 임포스터 정체 필드가 없고 키워드는 임포스터에게만 감춰진다', () => {
    const { room, ids } = makeRoom(3);
    configRoom(room, ids[0], { mode: 'imposter' });
    startGame(room, ids[0]);
    const g = room.game;
    for (const viewer of ids) {
      const state = buildState(room, viewer);
      expect(state.game.imposter).toBeUndefined();
      expect(state.game.imposterId).toBeUndefined();
      if (viewer === g.imposterId) {
        expect(state.game.youAreImposter).toBe(true);
        expect(state.game.keyword).toBeNull();
      } else {
        expect(state.game.youAreImposter).toBe(false);
        expect(state.game.keyword).toEqual(g.keyword);
      }
    }
  });

  it('종료 후에는 임포스터 닉네임이 결과로 공개된다', () => {
    const { room, ids } = makeRoom(3);
    configRoom(room, ids[0], { mode: 'imposter' });
    startGame(room, ids[0]);
    const g = room.game;
    while (g.phase === 'turns') {
      const pid = g.order[g.turn];
      applyDraft(room, pid, '프롬프트', `url-${g.turn}`);
      submitAction(room, pid, {});
    }
    guessAction(room, g.imposterId, '전혀 다른 오답');
    expect(room.status).toBe('finished');
    const imposterNickname = room.players.find((p) => p.id === g.imposterId).nickname;
    for (const viewer of ids) {
      const state = buildState(room, viewer);
      expect(state.results.imposter).toBe(imposterNickname);
      expect(state.results.keyword).toEqual(g.keyword);
      expect(state.results.won).toBe(false);
    }
  });
});

describe('speed 공개 범위', () => {
  it('draw 단계에서 keyword는 drawer에게만 보인다', () => {
    const { room, ids } = makeRoom(2);
    configRoom(room, ids[0], { mode: 'speed' });
    startGame(room, ids[0]);
    const g = room.game;
    const drawer = g.drawerId;
    const guesser = ids.find((id) => id !== drawer);
    applyDraft(room, drawer, '그림', 'url');
    const drawerView = buildState(room, drawer);
    expect(drawerView.game.keyword).toEqual(g.keyword);
    expect(drawerView.game.draft).toEqual({ prompt: '그림', url: 'url' });
    const guesserView = buildState(room, guesser);
    expect(guesserView.game.keyword).toBeNull();
    expect(guesserView.game.draft).toBeNull();
    expect(guesserView.game.image).toBeNull();
  });

  it('정답 guess의 text는 reveal 전에는 null로 마스킹된다', () => {
    const { room, ids } = makeRoom(3);
    configRoom(room, ids[0], { mode: 'speed' });
    startGame(room, ids[0]);
    const g = room.game;
    applyDraft(room, g.drawerId, '그림', 'url');
    submitAction(room, g.drawerId, {});
    g.guesses.push({ nickname: '손님1', team: null, text: '틀린 답', correct: false });
    g.guesses.push({ nickname: '손님2', team: null, text: g.keyword.ko, correct: true });
    const view = buildState(room, ids[0]);
    expect(view.game.phase).toBe('guess');
    expect(view.game.guesses[0].text).toBe('틀린 답');
    expect(view.game.guesses[1].text).toBeNull();
    g.phase = 'reveal';
    const revealView = buildState(room, ids[0]);
    expect(revealView.game.guesses[1].text).toBe(g.keyword.ko);
  });
});

describe('speed_team 공개 범위', () => {
  it('상대 팀 image는 reveal 전에는 null이다', () => {
    const { room, ids } = makeRoom(4);
    configRoom(room, ids[0], { mode: 'speed_team' });
    setTeam(room, ids[0], 0);
    setTeam(room, ids[1], 0);
    setTeam(room, ids[2], 1);
    setTeam(room, ids[3], 1);
    startGame(room, ids[0]);
    const g = room.game;
    for (const t of [0, 1]) {
      applyDraft(room, g.drawers[t], `그림${t}`, `url-${t}`);
      submitAction(room, g.drawers[t], {});
    }
    const team0View = buildState(room, ids[0]);
    expect(team0View.game.teams[0].image).toBe('url-0');
    expect(team0View.game.teams[1].image).toBeNull();
    expect(team0View.game.teams[1].imageReady).toBe(true);
    const team1Viewer = room.players.find((p) => p.team === 1).id;
    const team1View = buildState(room, team1Viewer);
    expect(team1View.game.teams[1].image).toBe('url-1');
    expect(team1View.game.teams[0].image).toBeNull();
    g.phase = 'reveal';
    const revealView = buildState(room, ids[0]);
    expect(revealView.game.teams[0].image).toBe('url-0');
    expect(revealView.game.teams[1].image).toBe('url-1');
  });
});
