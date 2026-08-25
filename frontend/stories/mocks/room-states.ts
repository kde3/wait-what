import type { GameMode, RoomState, RoomStatus } from '../../types/room';

// 홈의 공개방 목록 — 백엔드 listPublicRooms()가 돌려주는 항목 모양
interface PublicRoomSummary {
  code: string;
  name: string;
  mode: GameMode;
  status: RoomStatus;
  players: number;
  maxPlayers: number;
}

export const homeRooms: PublicRoomSummary[] = [
  { code: 'PLAY', name: 'AI 그림 전화방', mode: 'classic', status: 'room', players: 3, maxPlayers: 12 },
  { code: 'COOP', name: '협동 연습방', mode: 'coop', status: 'playing', players: 6, maxPlayers: 12 },
  { code: 'IMPS', name: '임포스터 한 판', mode: 'imposter', status: 'room', players: 5, maxPlayers: 12 },
];

export const emptyHomeRooms: PublicRoomSummary[] = [];

export const roomState: RoomState = {
  code: 'PLAY',
  name: 'AI 그림 전화방',
  isPublic: true,
  status: 'room',
  mode: 'classic',
  teamGame: false,
  maxPlayers: 12,
  options: {
    difficulty: 'normal',
    textSeconds: 45,
    imageSeconds: 90,
    rounds: 5,
    teamMode: false,
    fixedDrawer: false,
    fixedDrawerIndex: 0,
    scored: true,
  },
  players: [
    { nickname: '익명 방장', isHost: true, team: null, score: 0, you: true },
    { nickname: '그림 고양이', isHost: false, team: null, score: 0 },
    { nickname: '초록 로봇', isHost: false, team: null, score: 0 },
  ],
  you: { nickname: '익명 방장', isHost: true, team: null, score: 0 },
};

export const teamRoomState: RoomState = {
  ...roomState,
  mode: 'coop',
  teamGame: true,
  options: { ...roomState.options, teamMode: true },
  players: [
    { nickname: '익명 방장', isHost: true, team: 0, score: 0, you: true },
    { nickname: '그림 고양이', isHost: false, team: 0, score: 0 },
    { nickname: '초록 로봇', isHost: false, team: 1, score: 0 },
    { nickname: '라면 화가', isHost: false, team: 1, score: 0 },
  ],
  you: { nickname: '익명 방장', isHost: true, team: 0, score: 0 },
};

export const classicPhraseState: RoomState = {
  ...roomState,
  status: 'playing',
  game: {
    kind: 'classic',
    round: 1,
    total: 5,
    remaining: 45,
    task: { kind: 'phrase' },
    submitted: false,
    draft: null,
    players: roomState.players.map((player) => ({ nickname: player.nickname, submitted: false })),
  },
};

export const classicDrawingState: RoomState = {
  ...roomState,
  status: 'playing',
  game: {
    kind: 'classic',
    round: 2,
    total: 5,
    remaining: 90,
    task: { kind: 'draw', sourceText: '우주복을 입은 고양이가 라면을 먹는 모습' },
    submitted: false,
    draft: null,
    players: roomState.players.map((player) => ({ nickname: player.nickname, submitted: false })),
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
  ...roomState,
  status: 'playing',
  game: {
    kind: 'classic',
    round: 3,
    total: 5,
    remaining: 45,
    task: { kind: 'guess', sourceImage: '/images/mock-image.png' },
    submitted: false,
    draft: null,
    players: roomState.players.map((player) => ({ nickname: player.nickname, submitted: false })),
  },
};

export const classicResultState: RoomState = {
  ...roomState,
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
