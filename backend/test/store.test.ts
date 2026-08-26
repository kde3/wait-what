import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  advance,
  applyDraft,
  backToLobby,
  canGenerate,
  chatAction,
  classicChainIndex,
  classicRoundType,
  configRoom,
  createRoom,
  deleteRoom,
  getRoom,
  guessAction,
  joinRoom,
  listPublicRooms,
  mockAiScore,
  normalizeText,
  promptViolation,
  removePlayer,
  setTeam,
  startGame,
  stayInRoom,
  submitAction,
  unsubmitAction,
  voteAction,
  wordMatches,
} from '../lib/store';
import { CHAOS_CHARACTERS } from '../lib/chaos';

const DEFAULT_CLASSIC_PHRASE = '우주복을 입은 고양이가 라면을 먹는 모습';
const codes: string[] = [];

function makeRoom(count = 1, opts: Record<string, any> = {}) {
  const { room, playerId } = createRoom('방장', opts);
  codes.push(room.code);
  const ids = [playerId];
  for (let i = 1; i < count; i++) {
    const joined = joinRoom(room.code, `손님${i}`);
    ids.push(joined.playerId);
  }
  return { room, ids };
}

function timeout(room) {
  vi.useFakeTimers();
  vi.setSystemTime(room.game.endsAt + 1000);
  advance(room);
}

afterEach(() => {
  vi.useRealTimers();
  for (const code of codes.splice(0)) deleteRoom(code);
});

describe('createRoom / joinRoom', () => {
  it('방을 만들면 4자리 코드와 방장 플레이어가 생긴다', () => {
    const { room, ids } = makeRoom();
    expect(room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(room.status).toBe('room');
    expect(room.players).toHaveLength(1);
    expect(room.players[0].id).toBe(ids[0]);
    expect(room.players[0].isHost).toBe(true);
    expect(room.isPublic).toBe(true);
    expect(getRoom(room.code.toLowerCase())).toBe(room);
  });

  it('닉네임으로 입장하면 플레이어가 추가된다', () => {
    const { room, ids } = makeRoom(2);
    expect(room.players).toHaveLength(2);
    expect(room.players[1].id).toBe(ids[1]);
    expect(room.players[1].nickname).toBe('손님1');
    expect(room.players[1].isHost).toBe(false);
  });

  it('없는 방은 errRoomNotFound', () => {
    expect(joinRoom('ZZZZZ', '아무개').error).toBe('errRoomNotFound');
  });

  it('비밀번호 방은 틀린 비번이면 errWrongPassword, 맞으면 입장', () => {
    const { room } = makeRoom(1, { password: '1234' });
    expect(room.isPublic).toBe(false);
    expect(joinRoom(room.code, '손님', '9999').error).toBe('errWrongPassword');
    expect(joinRoom(room.code, '손님', undefined).error).toBe('errWrongPassword');
    expect(joinRoom(room.code, '손님', '1234').playerId).toBeTruthy();
  });

  it('정원 12명을 넘으면 errRoomFull', () => {
    const { room } = makeRoom(MAX_PLAYERS);
    expect(room.players).toHaveLength(12);
    expect(joinRoom(room.code, '13번째').error).toBe('errRoomFull');
  });

  it('시작한 방은 errAlreadyStarted', () => {
    const { room, ids } = makeRoom(1);
    expect(startGame(room, ids[0])).toEqual({});
    expect(joinRoom(room.code, '지각생').error).toBe('errAlreadyStarted');
  });

  it('공개방 목록에 비밀번호 방은 나오지 않는다', () => {
    const { room: open } = makeRoom();
    const { room: locked } = makeRoom(1, { password: 'pw' });
    const listed = listPublicRooms().map((r) => r.code);
    expect(listed).toContain(open.code);
    expect(listed).not.toContain(locked.code);
  });
});

describe('configRoom', () => {
  it('방장이 아니면 errHostOnly', () => {
    const { room, ids } = makeRoom(2);
    expect(configRoom(room, ids[1], { mode: 'speed' }).error).toBe('errHostOnly');
  });

  it('옵션은 범위로 clamp된다', () => {
    const { room, ids } = makeRoom();
    configRoom(room, ids[0], { options: { textSeconds: 1, imageSeconds: 9999, rounds: 0 } });
    expect(room.options.textSeconds).toBe(15);
    expect(room.options.imageSeconds).toBe(600);
    expect(room.options.rounds).toBe(1);
    configRoom(room, ids[0], { options: { textSeconds: 999, imageSeconds: 1, rounds: 99 } });
    expect(room.options.textSeconds).toBe(300);
    expect(room.options.imageSeconds).toBe(30);
    expect(room.options.rounds).toBe(20);
    configRoom(room, ids[0], { options: { textSeconds: '숫자아님' } });
    expect(room.options.textSeconds).toBe(300);
  });

  it('모드 변경은 유효한 값만 허용한다', () => {
    const { room, ids } = makeRoom();
    expect(configRoom(room, ids[0], { mode: 'speed' })).toEqual({});
    expect(room.mode).toBe('speed');
    expect(configRoom(room, ids[0], { mode: '없는모드' }).error).toBe('errBadMode');
    expect(room.mode).toBe('speed');
  });

  it('난이도는 목록에 있는 값만 반영한다', () => {
    const { room, ids } = makeRoom();
    configRoom(room, ids[0], { options: { difficulty: 'easy' } });
    expect(room.options.difficulty).toBe('easy');
    configRoom(room, ids[0], { options: { difficulty: 'impossible' } });
    expect(room.options.difficulty).toBe('easy');
  });

  it('시작 후에는 errAlreadyStarted', () => {
    const { room, ids } = makeRoom();
    startGame(room, ids[0]);
    expect(configRoom(room, ids[0], { mode: 'speed' }).error).toBe('errAlreadyStarted');
  });
});

describe('팀 배정', () => {
  it('팀 게임이 아니면 setTeam은 errNotTeamGame', () => {
    const { room, ids } = makeRoom(2);
    expect(setTeam(room, ids[1], 1).error).toBe('errNotTeamGame');
  });

  it('speed_team으로 바꾸면 팀이 자동 배정된다', () => {
    const { room, ids } = makeRoom(3);
    configRoom(room, ids[0], { mode: 'speed_team' });
    expect(room.players.map((p) => p.team)).toEqual([0, 1, 0]);
  });

  it('팀 게임 입장자는 인원이 적은 팀에 배정된다', () => {
    const { room, ids } = makeRoom(1);
    configRoom(room, ids[0], { mode: 'speed_team' });
    const second = joinRoom(room.code, '손님1');
    const third = joinRoom(room.code, '손님2');
    expect(room.players.find((p) => p.id === second.playerId).team).toBe(1);
    expect(room.players.find((p) => p.id === third.playerId).team).toBe(0);
  });

  it('setTeam은 0/1만 허용하고 명단에 없는 사람은 거부한다', () => {
    const { room, ids } = makeRoom(2);
    configRoom(room, ids[0], { mode: 'speed_team' });
    expect(setTeam(room, ids[1], 2).error).toBe('errBadTeam');
    expect(setTeam(room, '유령id', 0).error).toBe('errNotPlayer');
    expect(setTeam(room, ids[1], 0)).toEqual({});
    expect(room.players[1].team).toBe(0);
  });
});

describe('startGame 최소 인원', () => {
  it('classic은 1명, coop은 1명부터 시작 가능', () => {
    const { room: classic, ids: a } = makeRoom();
    expect(startGame(classic, a[0])).toEqual({});
    const { room: coop, ids: b } = makeRoom();
    configRoom(coop, b[0], { mode: 'coop' });
    expect(startGame(coop, b[0])).toEqual({});
  });

  it('speed는 2명 필요', () => {
    const { room, ids } = makeRoom(1);
    configRoom(room, ids[0], { mode: 'speed' });
    expect(startGame(room, ids[0]).error).toBe('errNotEnoughPlayers');
    joinRoom(room.code, '손님1');
    expect(startGame(room, ids[0])).toEqual({});
  });

  it('speed_team은 2명 + 양 팀에 1명씩 필요', () => {
    const { room, ids } = makeRoom(2);
    configRoom(room, ids[0], { mode: 'speed_team' });
    setTeam(room, ids[0], 0);
    setTeam(room, ids[1], 0);
    expect(startGame(room, ids[0]).error).toBe('errTeamEmpty');
    setTeam(room, ids[1], 1);
    expect(startGame(room, ids[0])).toEqual({});
  });

  it('imposter는 3명 필요', () => {
    const { room, ids } = makeRoom(2);
    configRoom(room, ids[0], { mode: 'imposter' });
    expect(startGame(room, ids[0]).error).toBe('errNotEnoughPlayers');
    joinRoom(room.code, '손님2');
    expect(startGame(room, ids[0])).toEqual({});
  });

  it('방장이 아니면 errHostOnly, 이미 시작했으면 errAlreadyStarted', () => {
    const { room, ids } = makeRoom(2);
    expect(startGame(room, ids[1]).error).toBe('errHostOnly');
    startGame(room, ids[0]);
    expect(startGame(room, ids[0]).error).toBe('errAlreadyStarted');
  });
});

describe('classic', () => {
  it('라운드 0 텍스트 타임아웃이면 기본 문구가 체인에 들어간다', () => {
    const { room, ids } = makeRoom(1);
    startGame(room, ids[0]);
    expect(room.game.totalRounds).toBe(2);
    expect(classicRoundType(room.game.round)).toBe('text');
    advance(room);
    expect(room.game.round).toBe(0);
    timeout(room);
    expect(room.game.round).toBe(1);
    expect(room.game.chains[0][0]).toMatchObject({ type: 'text', text: DEFAULT_CLASSIC_PHRASE });
  });

  it('텍스트와 이미지 라운드가 교대한다', () => {
    expect(classicRoundType(0)).toBe('text');
    expect(classicRoundType(1)).toBe('image');
    expect(classicRoundType(2)).toBe('text');
  });

  it('classicChainIndex는 라운드마다 한 칸씩 회전한다', () => {
    const { room, ids } = makeRoom(3);
    startGame(room, ids[0]);
    const g = room.game;
    for (const id of ids) {
      expect(classicChainIndex(room, id)).toBe(g.order.indexOf(id));
    }
    g.round = 1;
    for (const id of ids) {
      const k = g.order.indexOf(id);
      expect(classicChainIndex(room, id)).toBe((k - 1 + 3) % 3);
    }
    expect(classicChainIndex(room, '유령id')).toBe(-1);
  });

  it('전원 제출하면 시간과 무관하게 즉시 다음 라운드로 간다', () => {
    const { room, ids } = makeRoom(2);
    startGame(room, ids[0]);
    expect(submitAction(room, ids[0], { text: '첫 문장' })).toEqual({});
    expect(room.game.round).toBe(0);
    expect(submitAction(room, ids[1], { text: '둘째 문장' })).toEqual({});
    expect(room.game.round).toBe(1);
    expect(classicRoundType(room.game.round)).toBe('image');
  });

  it('빈 텍스트 제출은 errEmptyText', () => {
    const { room, ids } = makeRoom(2);
    startGame(room, ids[0]);
    expect(submitAction(room, ids[0], { text: '   ' }).error).toBe('errEmptyText');
  });

  it('이미지 라운드는 생성 없이 제출하면 errGenerateFirst', () => {
    const { room, ids } = makeRoom(2);
    startGame(room, ids[0]);
    submitAction(room, ids[0], { text: '고양이' });
    submitAction(room, ids[1], { text: '강아지' });
    expect(canGenerate(room, ids[0])).toEqual({ keyword: '강아지' });
    expect(promptViolation(room, '귀여운 강아지 그림', canGenerate(room, ids[0]).keyword)).toBe('강아지');
    expect(submitAction(room, ids[0], {}).error).toBe('errGenerateFirst');
    applyDraft(room, ids[0], '고양이 그림', '/api/mock-image?s=1');
    expect(submitAction(room, ids[0], {})).toEqual({});
  });

  it('텍스트 라운드에는 canGenerate가 errNotDrawPhase', () => {
    const { room, ids } = makeRoom(2);
    startGame(room, ids[0]);
    expect(canGenerate(room, ids[0]).error).toBe('errNotDrawPhase');
  });

  it('unsubmit하면 제출 상태가 풀린다', () => {
    const { room, ids } = makeRoom(2);
    startGame(room, ids[0]);
    submitAction(room, ids[0], { text: '문장' });
    expect(room.game.submissions.get(ids[0]).submitted).toBe(true);
    expect(unsubmitAction(room, ids[0])).toEqual({});
    expect(room.game.submissions.get(ids[0]).submitted).toBe(false);
  });

  it('마지막 라운드까지 제출하면 finished가 되고 체인이 완성된다', () => {
    const { room, ids } = makeRoom(2);
    startGame(room, ids[0]);
    submitAction(room, ids[0], { text: '방장의 문장' });
    submitAction(room, ids[1], { text: '손님의 문장' });
    for (const id of ids) {
      applyDraft(room, id, '프롬프트', `/api/mock-image?s=${id}`);
      submitAction(room, id, {});
    }
    expect(room.status).toBe('finished');
    for (const chain of room.game.chains) {
      expect(chain).toHaveLength(2);
      expect(chain[0].type).toBe('text');
      expect(chain[1].type).toBe('image');
    }
    const g = room.game;
    const k0 = g.order.indexOf(ids[0]);
    expect(g.chains[k0][0].authorId).toBe(ids[0]);
    expect(g.chains[(k0 - 1 + 2) % 2][1].authorId).toBe(ids[0]);
  });

  it('이미지 라운드 타임아웃이면 url 없는 엔트리로 진행된다', () => {
    const { room, ids } = makeRoom(1);
    startGame(room, ids[0]);
    submitAction(room, ids[0], { text: '문장' });
    timeout(room);
    expect(room.status).toBe('finished');
    expect(room.game.chains[0][1]).toMatchObject({ type: 'image', url: null });
  });
});

describe('chaos', () => {
  it('게임 시작 시 7개 캐릭터 중 정확히 하나를 서버가 선택하고 공개 단계를 8초간 유지한다', () => {
    const { room, ids } = makeRoom(2);
    configRoom(room, ids[0], { mode: 'chaos' });
    const startedAt = Date.now();
    expect(startGame(room, ids[0])).toEqual({});
    expect(CHAOS_CHARACTERS.map((character) => character.id)).toContain(room.game.chaosCharacterId);
    expect(room.game.phase).toBe('reveal');
    expect(room.game.chaosCharacterId).toBeTruthy();
    expect(room.game.revealEndsAt - startedAt).toBe(8000);
  });

  it('reveal 동안 행동을 막고 종료 후 클래식 흐름을 그대로 사용한다', () => {
    const { room, ids } = makeRoom(2);
    configRoom(room, ids[0], { mode: 'chaos' });
    startGame(room, ids[0]);
    expect(submitAction(room, ids[0], { text: '문장' }).error).toBe('errChaosReveal');
    expect(canGenerate(room, ids[0]).error).toBe('errChaosReveal');
    vi.useFakeTimers();
    vi.setSystemTime(room.game.revealEndsAt + 1);
    advance(room);
    expect(room.game.phase).toBe('play');
    expect(submitAction(room, ids[0], { text: '문장' })).toEqual({});
  });

  it('새 게임마다 캐릭터를 다시 랜덤 선택한다', () => {
    const { room, ids } = makeRoom(1);
    configRoom(room, ids[0], { mode: 'chaos' });
    const random = vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0.999);
    startGame(room, ids[0]);
    const first = room.game.chaosCharacterId;
    backToLobby(room);
    startGame(room, ids[0]);
    const second = room.game.chaosCharacterId;
    expect(first).toBe('404');
    expect(second).toBe('null');
    random.mockRestore();
  });
});

describe('speed', () => {
  function speedRoom(count = 2, options: Record<string, any> = {}) {
    const { room, ids } = makeRoom(count);
    configRoom(room, ids[0], { mode: 'speed', options });
    startGame(room, ids[0]);
    return { room, ids };
  }

  it('생성 전부터 정답을 시도할 수 있고 이미지 확정 시 타이머가 초기화되지 않는다', () => {
    const { room, ids } = speedRoom();
    const g = room.game;
    expect(g.phase).toBe('draw');
    const drawer = g.drawerId;
    const guesser = ids.find((id) => id !== drawer);
    expect(canGenerate(room, guesser).error).toBe('errNotYourTurn');
    expect(canGenerate(room, drawer).keyword).toBe(g.keyword);
    expect(guessAction(room, guesser, '완전 오답')).toEqual({ correct: false });
    expect(submitAction(room, drawer, {}).error).toBe('errGenerateFirst');
    const endsAt = g.endsAt;
    applyDraft(room, drawer, '그림', '/api/mock-image?s=1');
    expect(submitAction(room, drawer, {})).toEqual({});
    expect(g.phase).toBe('guess');
    expect(g.image).toBe('/api/mock-image?s=1');
    expect(g.endsAt).toBe(endsAt);
  });

  it('정답을 맞히면 개인전에서는 맞힌 사람과 그린 사람이 각각 +1', () => {
    const { room, ids } = speedRoom();
    const g = room.game;
    const drawer = g.drawerId;
    const guesser = ids.find((id) => id !== drawer);
    applyDraft(room, drawer, '그림', 'url');
    submitAction(room, drawer, {});
    expect(guessAction(room, guesser, '완전 오답')).toEqual({ correct: false });
    expect(guessAction(room, guesser, g.keyword.ko)).toEqual({ correct: true });
    expect(g.phase).toBe('reveal');
    expect(g.winnerId).toBe(guesser);
    expect(room.players.find((p) => p.id === guesser).score).toBe(1);
    expect(room.players.find((p) => p.id === drawer).score).toBe(1);
    expect(g.history[0]).toMatchObject({ winner: room.players.find((p) => p.id === guesser).nickname });
  });

  it('teamMode면 개인 점수 대신 teamScores가 오른다', () => {
    const { room, ids } = speedRoom(2, { teamMode: true });
    const g = room.game;
    const drawer = g.drawerId;
    const guesser = ids.find((id) => id !== drawer);
    applyDraft(room, drawer, '그림', 'url');
    submitAction(room, drawer, {});
    guessAction(room, guesser, g.keyword.en);
    const guesserTeam = room.players.find((p) => p.id === guesser).team;
    expect(g.teamScores[guesserTeam]).toBe(1);
    expect(room.players.every((p) => p.score === 0)).toBe(true);
  });

  it('drawer는 guess할 수 없다', () => {
    const { room } = speedRoom();
    const g = room.game;
    applyDraft(room, g.drawerId, '그림', 'url');
    submitAction(room, g.drawerId, {});
    expect(guessAction(room, g.drawerId, g.keyword.ko).error).toBe('errDrawerCannotGuess');
  });

  it('draw 타임아웃에 드래프트가 없으면 무승부 reveal로 넘어간다', () => {
    const { room } = speedRoom();
    timeout(room);
    const g = room.game;
    expect(g.phase).toBe('reveal');
    expect(g.winnerId).toBeNull();
    expect(g.history[0].winner).toBeNull();
  });

  it('guess 타임아웃이면 무승부로 라운드가 끝난다', () => {
    const { room } = speedRoom();
    const g = room.game;
    applyDraft(room, g.drawerId, '그림', 'url');
    submitAction(room, g.drawerId, {});
    timeout(room);
    expect(g.phase).toBe('reveal');
    expect(g.winnerId).toBeNull();
  });

  it('reveal이 끝나면 다음 라운드, 라운드 소진이면 finished', () => {
    const { room, ids } = makeRoom(2);
    configRoom(room, ids[0], { mode: 'speed', options: { rounds: 2 } });
    startGame(room, ids[0]);
    timeout(room);
    timeout(room);
    expect(room.game.round).toBe(1);
    expect(room.game.phase).toBe('draw');
    timeout(room);
    timeout(room);
    expect(room.status).toBe('finished');
  });

  it('fixedDrawer면 지정된 사람이 계속 그리고, 없으면 방장이 대신 그린다', () => {
    const { room, ids } = makeRoom(2);
    configRoom(room, ids[0], { mode: 'speed', options: { fixedDrawer: true, fixedDrawerIndex: 1 } });
    startGame(room, ids[0]);
    expect(room.game.drawerId).toBe(ids[1]);
    timeout(room);
    timeout(room);
    expect(room.game.drawerId).toBe(ids[1]);
    removePlayer(room, ids[1]);
    timeout(room);
    timeout(room);
    expect(room.game.drawerId).toBe(ids[0]);
  });
});

describe('speed_team', () => {
  function teamRoom() {
    const { room, ids } = makeRoom(4);
    configRoom(room, ids[0], { mode: 'speed_team' });
    setTeam(room, ids[0], 0);
    setTeam(room, ids[1], 0);
    setTeam(room, ids[2], 1);
    setTeam(room, ids[3], 1);
    startGame(room, ids[0]);
    return { room, ids };
  }

  it('팀마다 drawer가 배정된다', () => {
    const { room } = teamRoom();
    const g = room.game;
    expect(room.players.find((p) => p.id === g.drawers[0]).team).toBe(0);
    expect(room.players.find((p) => p.id === g.drawers[1]).team).toBe(1);
  });

  it('자기 팀 이미지가 없어도 guess할 수 있다', () => {
    const { room } = teamRoom();
    const g = room.game;
    const guesser = room.players.find((p) => p.team === 0 && p.id !== g.drawers[0]).id;
    expect(guessAction(room, guesser, '완전 오답')).toEqual({ correct: false });
  });

  it('drawer가 제출하면 팀 이미지가 확정되고 정답 시 teamScores가 오른다', () => {
    const { room } = teamRoom();
    const g = room.game;
    const drawer = g.drawers[0];
    expect(canGenerate(room, drawer).keyword).toBe(g.keyword);
    applyDraft(room, drawer, '그림', 'url-0');
    expect(submitAction(room, drawer, {})).toEqual({});
    expect(g.teams[0].image).toBe('url-0');
    expect(guessAction(room, drawer, g.keyword.ko).error).toBe('errDrawerCannotGuess');
    const guesser = room.players.find((p) => p.team === 0 && p.id !== drawer).id;
    expect(guessAction(room, guesser, g.keyword.en)).toEqual({ correct: true });
    expect(g.phase).toBe('reveal');
    expect(g.winnerTeam).toBe(0);
    expect(g.teamScores).toEqual([1, 0]);
  });

  it('다른 팀 drawer 자리에서는 생성할 수 없다', () => {
    const { room } = teamRoom();
    const g = room.game;
    const otherMember = room.players.find((p) => p.team === 1 && p.id !== g.drawers[1]).id;
    expect(canGenerate(room, otherMember).error).toBe('errNotYourTurn');
  });
});

describe('coop', () => {
  it('전원 제출하면 즉시 finished가 되고 점수가 붙는다', () => {
    const { room, ids } = makeRoom(1);
    configRoom(room, ids[0], { mode: 'coop' });
    startGame(room, ids[0]);
    expect(canGenerate(room, ids[0])).toEqual({ keyword: room.game.theme });
    expect(submitAction(room, ids[0], {}).error).toBe('errGenerateFirst');
    applyDraft(room, ids[0], '조각 그림', 'url');
    submitAction(room, ids[0], {});
    expect(room.status).toBe('finished');
    expect(room.game.groups[0].score).toBe(Math.min(100, mockAiScore(room.code + ':coop:0')));
  });

  it('scored면 미제출 인원 수만큼 10점씩 감점된다', () => {
    const { room, ids } = makeRoom(2);
    configRoom(room, ids[0], { mode: 'coop' });
    startGame(room, ids[0]);
    applyDraft(room, ids[0], '조각', 'url');
    submitAction(room, ids[0], {});
    expect(room.status).toBe('playing');
    timeout(room);
    expect(room.status).toBe('finished');
    expect(room.game.groups[0].score).toBe(Math.min(100, mockAiScore(room.code + ':coop:0') - 10));
  });

  it('scored가 아니면 점수가 null로 남는다', () => {
    const { room, ids } = makeRoom(1);
    configRoom(room, ids[0], { mode: 'coop', options: { scored: false } });
    startGame(room, ids[0]);
    applyDraft(room, ids[0], '조각', 'url');
    submitAction(room, ids[0], {});
    expect(room.status).toBe('finished');
    expect(room.game.groups[0].score).toBeNull();
  });

  it('unsubmit하면 제출이 풀려서 게임이 끝나지 않는다', () => {
    const { room, ids } = makeRoom(2);
    configRoom(room, ids[0], { mode: 'coop' });
    startGame(room, ids[0]);
    applyDraft(room, ids[0], '조각', 'url');
    submitAction(room, ids[0], {});
    expect(unsubmitAction(room, ids[0])).toEqual({});
    expect(room.game.subs.get(ids[0]).submitted).toBe(false);
  });
});

describe('imposter', () => {
  function imposterRoom() {
    const { room, ids } = makeRoom(3);
    configRoom(room, ids[0], { mode: 'imposter' });
    startGame(room, ids[0]);
    return { room, ids };
  }

  function playTurn(room) {
    const pid = room.game.order[room.game.turn];
    applyDraft(room, pid, '프롬프트', `url-${room.game.turn}`);
    submitAction(room, pid, {});
    return pid;
  }

  function playAllTurns(room) {
    while (room.game.phase === 'turns') playTurn(room);
  }

  function voteAllAgainst(room, targetId) {
    const g = room.game;
    const targetIndex = g.order.indexOf(targetId);
    const otherIndex = g.order.findIndex((id) => id !== targetId && room.players.some((p) => p.id === id));
    for (const p of [...room.players]) {
      voteAction(room, p.id, p.id === targetId ? otherIndex : targetIndex);
    }
  }

  it('자기 차례가 아니면 errNotYourTurn', () => {
    const { room } = imposterRoom();
    const g = room.game;
    const notCurrent = g.order[1];
    expect(canGenerate(room, notCurrent).error).toBe('errNotYourTurn');
    expect(submitAction(room, notCurrent, {}).error).toBe('errNotYourTurn');
  });

  it('생성 검사에는 임포스터를 포함해 모두 같은 keyword가 주어진다', () => {
    const { room } = imposterRoom();
    const g = room.game;
    for (let turn = 0; turn < g.order.length; turn++) {
      const pid = g.order[g.turn];
      const check = canGenerate(room, pid);
      expect(check.keyword).toBe(g.keyword);
      playTurn(room);
    }
    expect(g.phase).toBe('vote');
    expect(g.entries).toHaveLength(3);
    expect(g.entries.every((e) => !e.skipped)).toBe(true);
  });

  it('언어와 역할에 관계없이 키워드가 프롬프트에 들어가면 반려된다', () => {
    const { room } = imposterRoom();
    const g = room.game;
    expect(promptViolation(room, `아주 멋진 ${g.keyword.ko} 그림`, g.keyword)).toBe(g.keyword.ko);
    expect(promptViolation(room, `beautiful ${g.keyword.en} art`, g.keyword)).toBe(g.keyword.en);
    expect(promptViolation(room, '키워드 없는 평범한 그림', g.keyword)).toBeNull();
    const imposterCheck = canGenerate(room, g.imposterId);
    if (!imposterCheck.error) {
      expect(promptViolation(room, `아주 멋진 ${g.keyword.ko} 그림`, imposterCheck.keyword)).toBe(g.keyword.ko);
    }
  });

  it('차례 타임아웃이면 skipped 엔트리가 쌓인다', () => {
    const { room } = imposterRoom();
    const g = room.game;
    const first = g.order[0];
    timeout(room);
    expect(g.turn).toBe(1);
    expect(g.entries[0]).toMatchObject({ playerId: first, url: null, skipped: true });
  });

  it('차례 중 한 번이라도 생성했으면 타임아웃 시 마지막 이미지를 사용한다', () => {
    const { room } = imposterRoom();
    const g = room.game;
    const first = g.order[0];
    applyDraft(room, first, '첫 번째 프롬프트', 'url-first');
    applyDraft(room, first, '마지막 프롬프트', 'url-last');
    timeout(room);
    expect(g.entries[0]).toMatchObject({
      playerId: first,
      url: 'url-last',
      prompt: '마지막 프롬프트',
      skipped: false,
    });
  });

  it('전원 차례가 끝나면 vote phase가 되고 아직 추리할 수 없다', () => {
    const { room } = imposterRoom();
    const g = room.game;
    playAllTurns(room);
    expect(g.phase).toBe('vote');
    expect(g.votes.size).toBe(0);
    expect(guessAction(room, g.imposterId, g.keyword.ko).error).toBe('errNotGuessPhase');
  });

  it('자기 자신·중복·범위 밖 투표는 거부된다', () => {
    const { room } = imposterRoom();
    const g = room.game;
    playAllTurns(room);
    const voter = g.order[0];
    expect(voteAction(room, voter, 0).error).toBe('errCannotVoteSelf');
    expect(voteAction(room, voter, 99).error).toBe('errBadVoteTarget');
    expect(voteAction(room, voter, -1).error).toBe('errBadVoteTarget');
    expect(voteAction(room, voter, 1)).toEqual({});
    expect(voteAction(room, voter, 2).error).toBe('errAlreadyVoted');
  });

  it('일부만 투표하면 집계되지 않는다', () => {
    const { room } = imposterRoom();
    const g = room.game;
    playAllTurns(room);
    expect(voteAction(room, g.order[0], 1)).toEqual({});
    expect(g.phase).toBe('vote');
    expect(room.status).toBe('playing');
  });

  it('임포스터가 아닌 사람이 지목되면 임포스터 승리로 끝난다', () => {
    const { room } = imposterRoom();
    const g = room.game;
    playAllTurns(room);
    const innocent = room.players.find((p) => p.id !== g.imposterId).id;
    voteAllAgainst(room, innocent);
    expect(g.accusedId).toBe(innocent);
    expect(g.caught).toBe(false);
    expect(room.status).toBe('finished');
    expect(g.won).toBe(true);
    expect(g.guess).toBeNull();
  });

  it('표가 갈리면 아무도 지목되지 않아 임포스터가 승리한다', () => {
    const { room } = imposterRoom();
    const g = room.game;
    playAllTurns(room);
    voteAction(room, g.order[0], 1);
    voteAction(room, g.order[1], 2);
    voteAction(room, g.order[2], 0);
    expect(g.accusedId).toBeNull();
    expect(g.caught).toBe(false);
    expect(room.status).toBe('finished');
    expect(g.won).toBe(true);
  });

  it('아무도 투표하지 않고 시간이 끝나면 임포스터가 승리한다', () => {
    const { room } = imposterRoom();
    const g = room.game;
    playAllTurns(room);
    timeout(room);
    expect(g.caught).toBe(false);
    expect(room.status).toBe('finished');
    expect(g.won).toBe(true);
  });

  it('중퇴자에게는 투표할 수 없다', () => {
    const { room, ids } = makeRoom(4);
    configRoom(room, ids[0], { mode: 'imposter' });
    startGame(room, ids[0]);
    const g = room.game;
    playAllTurns(room);
    const leaver = room.players.find((p) => p.id !== g.imposterId).id;
    const leaverIndex = g.order.indexOf(leaver);
    removePlayer(room, leaver);
    advance(room);
    const voter = room.players.find((p) => p.id !== g.imposterId).id;
    expect(voteAction(room, voter, leaverIndex).error).toBe('errBadVoteTarget');
  });

  it('임포스터가 지목되면 guess phase로 넘어가고 임포스터만 추리할 수 있다', () => {
    const { room } = imposterRoom();
    const g = room.game;
    playAllTurns(room);
    voteAllAgainst(room, g.imposterId);
    expect(g.accusedId).toBe(g.imposterId);
    expect(g.caught).toBe(true);
    expect(g.phase).toBe('guess');
    expect(room.status).toBe('playing');
    const citizen = room.players.find((p) => p.id !== g.imposterId).id;
    expect(guessAction(room, citizen, '고양이').error).toBe('errImposterOnly');
    expect(guessAction(room, g.imposterId, g.keyword.en)).toEqual({ correct: true });
    expect(g.won).toBe(true);
    expect(room.status).toBe('finished');
  });

  it('임포스터가 다른 언어로 맞혀도 정답으로 인정된다', () => {
    const { room } = imposterRoom();
    const g = room.game;
    playAllTurns(room);
    voteAllAgainst(room, g.imposterId);
    expect(guessAction(room, g.imposterId, ` ${g.keyword.ja}! `)).toEqual({ correct: true });
  });

  it('지목된 임포스터가 키워드를 못 맞히면 크루 승리', () => {
    const { room } = imposterRoom();
    const g = room.game;
    playAllTurns(room);
    voteAllAgainst(room, g.imposterId);
    expect(guessAction(room, g.imposterId, '전혀 다른 오답')).toEqual({ correct: false });
    expect(room.status).toBe('finished');
    expect(g.won).toBe(false);
  });

  it('지목 후 추리 시간이 끝나면 크루 승리로 끝난다', () => {
    const { room } = imposterRoom();
    const g = room.game;
    playAllTurns(room);
    voteAllAgainst(room, g.imposterId);
    expect(g.phase).toBe('guess');
    timeout(room);
    expect(room.status).toBe('finished');
    expect(g.won).toBe(false);
    expect(g.guess).toBeNull();
  });

  it('임포스터가 나가면 시민 승리(won=false)', () => {
    const { room } = imposterRoom();
    const g = room.game;
    removePlayer(room, g.imposterId);
    advance(room);
    expect(room.status).toBe('finished');
    expect(g.won).toBe(false);
  });

  it('시민이 전원 나가면 임포스터 승리(won=true)', () => {
    const { room, ids } = imposterRoom();
    const g = room.game;
    for (const id of ids) if (id !== g.imposterId) removePlayer(room, id);
    advance(room);
    expect(room.status).toBe('finished');
    expect(g.won).toBe(true);
  });
});

describe('chat', () => {
  function chatRoom(mode = 'imposter', count = 3) {
    const { room, ids } = makeRoom(count);
    configRoom(room, ids[0], { mode });
    startGame(room, ids[0]);
    return { room, ids };
  }

  it('게임 중이 아니면 보낼 수 없다', () => {
    const { room, ids } = makeRoom(3);
    expect(chatAction(room, ids[0], '안녕').error).toBe('errNotPlaying');
  });

  it('빈 메시지와 방에 없는 사람은 거부된다', () => {
    const { room, ids } = chatRoom();
    expect(chatAction(room, ids[0], '   ').error).toBe('errEmptyText');
    expect(chatAction(room, '없는id', '안녕').error).toBe('errNotPlayer');
  });

  it('보낸 메시지가 닉네임과 함께 쌓인다', () => {
    const { room, ids } = chatRoom();
    expect(chatAction(room, ids[0], '  누가 수상해?  ')).toEqual({});
    expect(chatAction(room, ids[1], '나는 아니야')).toEqual({});
    expect(room.chat).toHaveLength(2);
    expect(room.chat[0]).toMatchObject({ playerId: ids[0], text: '누가 수상해?' });
    expect(room.chat[1].nickname).toBe(room.players.find((p) => p.id === ids[1]).nickname);
  });

  it('200자를 넘으면 잘린다', () => {
    const { room, ids } = chatRoom();
    chatAction(room, ids[0], 'ㄱ'.repeat(300));
    expect(room.chat[0].text).toHaveLength(200);
  });

  it('키워드를 그대로 적어도 막지 않는다 (전원 자유롭게 대화)', () => {
    const { room } = chatRoom();
    const g = room.game;
    const citizen = room.players.find((p) => p.id !== g.imposterId).id;
    expect(chatAction(room, citizen, `혹시 ${g.keyword.ko} 아니야?`)).toEqual({});
    expect(chatAction(room, citizen, `maybe ${g.keyword.en}?`)).toEqual({});
    expect(chatAction(room, g.imposterId, `${g.keyword.ko} 인가?`)).toEqual({});
    expect(room.chat).toHaveLength(3);
  });

  it('임포스터가 아닌 모드에서도 똑같이 동작한다', () => {
    const { room, ids } = chatRoom('speed', 3);
    expect(chatAction(room, ids[0], room.game.keyword.ko)).toEqual({});
    expect(room.chat).toHaveLength(1);
  });

  it('최근 60개만 남는다', () => {
    const { room, ids } = chatRoom();
    for (let i = 0; i < 65; i++) chatAction(room, ids[0], `메시지 ${i}`);
    expect(room.chat).toHaveLength(60);
    expect(room.chat[0].text).toBe('메시지 5');
    expect(room.chat[59].text).toBe('메시지 64');
  });

  it('로비로 돌아가면 비워지고 새 게임도 빈 채팅으로 시작한다', () => {
    const { room, ids } = chatRoom();
    chatAction(room, ids[0], '이전 판 대화');
    expect(room.chat).toHaveLength(1);
    backToLobby(room);
    expect(room.chat).toEqual([]);
    room.chat.push({ playerId: ids[0], nickname: '방장', text: '로비 잡담' });
    startGame(room, ids[0]);
    expect(room.chat).toEqual([]);
  });
});

describe('MIN_PLAYERS', () => {
  it('모드별 최소 인원이 startGame 검사와 일치한다', () => {
    expect(MIN_PLAYERS.imposter).toBe(3);
    for (const mode of ['classic', 'speed', 'speed_team', 'coop', 'imposter']) {
      const { room, ids } = makeRoom(MIN_PLAYERS[mode] - 1 || 1);
      configRoom(room, ids[0], { mode });
      if (MIN_PLAYERS[mode] > 1) expect(startGame(room, ids[0]).error, mode).toBe('errNotEnoughPlayers');
    }
  });
});

describe('removePlayer / stayInRoom', () => {
  it('방장이 나가면 다음 사람이 방장이 된다', () => {
    const { room, ids } = makeRoom(3);
    expect(removePlayer(room, ids[0])).toBe(true);
    expect(room.players[0].id).toBe(ids[1]);
    expect(room.players[0].isHost).toBe(true);
    expect(removePlayer(room, '유령id')).toBe(false);
  });

  it('finished 상태에서 전원이 머무르기를 누르면 로비로 돌아간다', () => {
    const { room, ids } = makeRoom(2);
    startGame(room, ids[0]);
    room.status = 'finished';
    expect(stayInRoom(room, ids[0])).toEqual({});
    expect(room.status).toBe('finished');
    stayInRoom(room, ids[1]);
    expect(room.status).toBe('room');
    expect(room.game).toBeNull();
    expect(room.players.every((p: any) => !p.staying && p.score === 0)).toBe(true);
  });

  it('머무르기 안 누른 사람이 나가서 전원 머무르기가 되면 로비로 돌아간다', () => {
    const { room, ids } = makeRoom(3);
    startGame(room, ids[0]);
    room.status = 'finished';
    stayInRoom(room, ids[0]);
    stayInRoom(room, ids[1]);
    expect(room.status).toBe('finished');
    removePlayer(room, ids[2]);
    expect(room.status).toBe('room');
  });
});

describe('normalizeText / wordMatches', () => {
  it('normalizeText는 대소문자·공백·문장부호를 무시한다', () => {
    expect(normalizeText('  Hot Air  Balloon! ')).toBe('hotairballoon');
    expect(normalizeText('고 양 이...')).toBe('고양이');
    expect(normalizeText(null)).toBe('');
    expect(normalizeText(undefined)).toBe('');
    expect(normalizeText('!!!')).toBe('');
  });

  it('wordMatches는 어떤 언어 표기로든 정답을 인정한다', () => {
    const word = { ko: '열기구', en: 'hot air balloon', ja: '気球', zh: '热气球' };
    expect(wordMatches(word, '열기구')).toBe(true);
    expect(wordMatches(word, 'HOT AIR BALLOON')).toBe(true);
    expect(wordMatches(word, 'hotairballoon')).toBe(true);
    expect(wordMatches(word, '気球')).toBe(true);
    expect(wordMatches(word, '풍선')).toBe(false);
    expect(wordMatches(word, '')).toBe(false);
    expect(wordMatches(word, '   ')).toBe(false);
    expect(wordMatches(null, '열기구')).toBe(false);
  });

  it('mockAiScore는 결정적이고 60~100 범위다', () => {
    const a = mockAiScore('seed');
    expect(mockAiScore('seed')).toBe(a);
    expect(a).toBeGreaterThanOrEqual(60);
    expect(a).toBeLessThanOrEqual(100);
  });
});
