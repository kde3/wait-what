import type { RoomState } from '../../types/room';

export const lobbyState: RoomState = {
  code: 'PLAY',
  name: 'AI 그림 전화방',
  isPublic: true,
  status: 'lobby',
  mode: 'classic',
  teamGame: false,
  options: {
    textSeconds: 45,
    imageSeconds: 90,
    rounds: 5,
    teamMode: false,
    fixedDrawer: false,
    scored: true,
    moderator: false,
  },
  players: [
    { nickname: '익명 방장', isHost: true, team: null, score: 0 },
    { nickname: '그림 고양이', isHost: false, team: null, score: 0 },
    { nickname: '초록 로봇', isHost: false, team: null, score: 0 },
  ],
  you: { nickname: '익명 방장', isHost: true, team: null, score: 0 },
};

export const teamLobbyState: RoomState = {
  ...lobbyState,
  mode: 'relay',
  teamGame: true,
  options: { ...lobbyState.options, teamMode: true },
  players: [
    { nickname: '익명 방장', isHost: true, team: 0, score: 0 },
    { nickname: '그림 고양이', isHost: false, team: 0, score: 0 },
    { nickname: '초록 로봇', isHost: false, team: 1, score: 0 },
    { nickname: '라면 화가', isHost: false, team: 1, score: 0 },
  ],
  you: { nickname: '익명 방장', isHost: true, team: 0, score: 0 },
};

export const classicPhraseState: RoomState = {
  ...lobbyState,
  status: 'playing',
  game: {
    kind: 'classic',
    round: 1,
    total: 5,
    remaining: 45,
    task: { kind: 'phrase' },
    submitted: false,
    draft: null,
    players: lobbyState.players.map((player) => ({ nickname: player.nickname, submitted: false })),
  },
};

export const classicDrawingState: RoomState = {
  ...lobbyState,
  status: 'playing',
  game: {
    kind: 'classic',
    round: 2,
    total: 5,
    remaining: 90,
    task: { kind: 'draw', sourceText: '우주복을 입은 고양이가 라면을 먹는 모습' },
    submitted: false,
    draft: null,
    players: lobbyState.players.map((player) => ({ nickname: player.nickname, submitted: false })),
  },
};

export const classicGeneratedDrawingState: RoomState = {
  ...classicDrawingState,
  game: {
    ...classicDrawingState.game,
    draft: {
      prompt: '우주복을 입은 고양이가 달 표면에서 라면을 먹는 모습',
      url: '/images/mock-image.png',
    },
  },
};

export const classicFollowingPhraseState: RoomState = {
  ...lobbyState,
  status: 'playing',
  game: {
    kind: 'classic',
    round: 3,
    total: 5,
    remaining: 45,
    task: { kind: 'guess', sourceImage: '/images/mock-image.png' },
    submitted: false,
    draft: null,
    players: lobbyState.players.map((player) => ({ nickname: player.nickname, submitted: false })),
  },
};

export const classicResultState: RoomState = {
  ...lobbyState,
  status: 'finished',
  results: {
    kind: 'classic',
    albums: [
      {
        owner: '익명 방장',
        entries: [
          { type: 'text', author: '익명 방장', text: '우주복을 입은 고양이가 라면을 먹는 모습' },
          { type: 'image', author: '그림 고양이', url: '/images/mock-image.png', prompt: '우주 고양이와 라면 그릇' },
          { type: 'text', author: '초록 로봇', text: '달에서 야식을 먹는 고양이' },
        ],
      },
    ],
  },
};
