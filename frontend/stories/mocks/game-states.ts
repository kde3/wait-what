import type { RoomState } from '../../types/room';
import { roomState, teamRoomState, classicPhraseState, classicGeneratedDrawingState } from './room-states';

const MOCK_IMAGE = '/images/mock-image.png';

const KW_SHIP = { ko: '해적선', en: 'pirate ship', ja: '海賊船', zh: '海盗船' };
const KW_RAINBOW = { ko: '무지개', en: 'rainbow', ja: '虹', zh: '彩虹' };
const KW_STATION = { ko: '우주 정거장', en: 'space station', ja: '宇宙ステーション', zh: '空间站' };
const KW_LIGHTHOUSE = { ko: '등대', en: 'lighthouse', ja: '灯台', zh: '灯塔' };

// 제출 후 상태 — 입력이 잠기고 제출 버튼이 수정 버튼으로 바뀌는지 확인용
export const classicSubmittedPhraseState: RoomState = {
  ...classicPhraseState,
  game: {
    ...classicPhraseState.game,
    submitted: true,
    draft: { text: '우주복을 입은 고양이가 라면을 먹는 모습' },
    players: roomState.players.map((player, index) => ({ nickname: player.nickname, submitted: index === 0 })),
  },
};

export const classicSubmittedDrawingState: RoomState = {
  ...classicGeneratedDrawingState,
  game: { ...classicGeneratedDrawingState.game, submitted: true },
};

const speedBase = { ...roomState, mode: 'speed' as const, status: 'playing' as const };

export const speedDrawState: RoomState = {
  ...speedBase,
  game: {
    kind: 'speed',
    round: 2,
    total: 5,
    phase: 'draw',
    remaining: 90,
    teamMode: false,
    drawer: '익명 방장',
    youAreDrawer: true,
    keyword: KW_SHIP,
    image: null,
    draft: { prompt: '폭풍우 속을 항해하는 해적선', url: MOCK_IMAGE },
    guesses: [],
    winner: null,
    teamScores: null,
  },
};

export const speedGuessState: RoomState = {
  ...speedBase,
  game: {
    kind: 'speed',
    round: 2,
    total: 5,
    phase: 'guess',
    remaining: 45,
    teamMode: false,
    drawer: '그림 고양이',
    youAreDrawer: false,
    keyword: null,
    image: MOCK_IMAGE,
    draft: null,
    guesses: [
      { nickname: '초록 로봇', text: '배', correct: false },
      { nickname: '익명 방장', text: '유령선', correct: false },
    ],
    winner: null,
    teamScores: null,
  },
};

export const speedRevealState: RoomState = {
  ...speedBase,
  game: {
    ...speedGuessState.game,
    phase: 'reveal',
    remaining: 6,
    keyword: KW_SHIP,
    guesses: [
      { nickname: '초록 로봇', text: '배', correct: false },
      { nickname: '그림 고양이', text: '해적선', correct: true },
    ],
    winner: '그림 고양이',
  },
};

export const speedResultState: RoomState = {
  ...speedBase,
  status: 'finished',
  results: {
    kind: 'speed',
    teamMode: false,
    teamScores: null,
    scores: [
      { nickname: '그림 고양이', score: 3, team: null },
      { nickname: '익명 방장', score: 2, team: null },
      { nickname: '초록 로봇', score: 1, team: null },
    ],
    history: [
      {
        keyword: KW_SHIP,
        drawer: '익명 방장',
        winner: '그림 고양이',
        winnerTeam: null,
        url: MOCK_IMAGE,
        prompt: '폭풍우 속 해적선',
      },
    ],
  },
};

export const speedTeamPlayState: RoomState = {
  ...teamRoomState,
  mode: 'speed_team',
  status: 'playing',
  game: {
    kind: 'speed_team',
    round: 1,
    total: 5,
    phase: 'play',
    remaining: 120,
    yourTeam: 0,
    youAreDrawer: true,
    keyword: KW_RAINBOW,
    teams: [
      { drawer: '익명 방장', imageReady: true, image: MOCK_IMAGE },
      { drawer: '초록 로봇', imageReady: false, image: null },
    ],
    draft: { prompt: '비 온 뒤 하늘에 걸린 무지개', url: MOCK_IMAGE },
    guesses: [{ nickname: '그림 고양이', team: 0, text: '하늘', correct: false }],
    winnerTeam: null,
    winner: null,
    teamScores: [1, 2],
  },
};

export const speedTeamResultState: RoomState = {
  ...teamRoomState,
  mode: 'speed_team',
  status: 'finished',
  results: {
    kind: 'speed_team',
    teamScores: [3, 2],
    history: [
      {
        keyword: KW_RAINBOW,
        urls: [MOCK_IMAGE, MOCK_IMAGE],
        drawers: ['익명 방장', '초록 로봇'],
        winner: '그림 고양이',
        winnerTeam: 0,
      },
    ],
  },
};

const coopBase = { ...roomState, mode: 'coop' as const, status: 'playing' as const };

export const coopPlayState: RoomState = {
  ...coopBase,
  game: {
    kind: 'coop',
    theme: KW_STATION,
    teamMode: false,
    remaining: 90,
    you: { submitted: false, draft: { prompt: null, url: null } },
    groups: [
      {
        team: null,
        cols: 2,
        cells: [
          { nickname: '익명 방장', submitted: false, url: null, you: true },
          { nickname: '그림 고양이', submitted: true, url: MOCK_IMAGE, you: false },
          { nickname: '초록 로봇', submitted: false, url: null, you: false },
        ],
      },
    ],
  },
};

export const coopSubmittedState: RoomState = {
  ...coopBase,
  game: {
    ...coopPlayState.game,
    you: { submitted: true, draft: { prompt: '정거장 창밖의 지구', url: MOCK_IMAGE } },
    groups: [
      {
        team: null,
        cols: 2,
        cells: [
          { nickname: '익명 방장', submitted: true, url: MOCK_IMAGE, you: true },
          { nickname: '그림 고양이', submitted: true, url: MOCK_IMAGE, you: false },
          { nickname: '초록 로봇', submitted: false, url: null, you: false },
        ],
      },
    ],
  },
};

export const coopResultState: RoomState = {
  ...coopBase,
  status: 'finished',
  results: {
    kind: 'coop',
    theme: KW_STATION,
    scored: true,
    teamMode: false,
    groups: [
      {
        team: null,
        score: 82,
        cols: 2,
        cells: [
          { nickname: '익명 방장', url: MOCK_IMAGE, prompt: '정거장 창밖의 지구' },
          { nickname: '그림 고양이', url: MOCK_IMAGE, prompt: '떠다니는 우주인' },
          { nickname: '중퇴자', url: null, prompt: null },
        ],
      },
    ],
  },
};

const imposterBase = { ...roomState, mode: 'imposter' as const, status: 'playing' as const };

export const imposterTurnState: RoomState = {
  ...imposterBase,
  game: {
    kind: 'imposter',
    phase: 'turns',
    remaining: 90,
    youAreImposter: false,
    keyword: KW_LIGHTHOUSE,
    order: ['익명 방장', '그림 고양이', '초록 로봇'],
    turnIndex: 0,
    turnNickname: '익명 방장',
    youAreCurrent: true,
    entries: [],
    draft: { prompt: null, url: null },
  },
};

export const imposterAsImposterState: RoomState = {
  ...imposterBase,
  game: {
    ...imposterTurnState.game,
    youAreImposter: true,
    keyword: null,
    turnIndex: 1,
    turnNickname: '그림 고양이',
    youAreCurrent: false,
    entries: [{ nickname: '익명 방장', url: MOCK_IMAGE, skipped: false }],
  },
};

export const imposterGuessState: RoomState = {
  ...imposterBase,
  game: {
    ...imposterTurnState.game,
    phase: 'guess',
    remaining: 45,
    youAreImposter: true,
    keyword: null,
    turnNickname: null,
    youAreCurrent: false,
    entries: [
      { nickname: '익명 방장', url: MOCK_IMAGE, skipped: false },
      { nickname: '그림 고양이', url: MOCK_IMAGE, skipped: false },
      { nickname: '중퇴자', url: null, skipped: true },
    ],
  },
};

export const imposterResultState: RoomState = {
  ...imposterBase,
  status: 'finished',
  results: {
    kind: 'imposter',
    keyword: KW_LIGHTHOUSE,
    imposter: '초록 로봇',
    guess: '전망대',
    won: false,
    entries: [
      { nickname: '익명 방장', url: MOCK_IMAGE, prompt: '바다 위의 흰 탑', skipped: false },
      { nickname: '그림 고양이', url: MOCK_IMAGE, prompt: '밤바다를 비추는 빛', skipped: false },
      { nickname: '중퇴자', url: null, prompt: null, skipped: true },
    ],
  },
};
