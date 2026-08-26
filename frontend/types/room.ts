export type GameMode = 'classic' | 'speed' | 'speed_team' | 'coop' | 'chaos' | 'imposter';
export type RoomStatus = 'room' | 'playing' | 'finished';

export interface Player {
  nickname: string;
  isHost: boolean;
  team: number | null;
  score: number;
  staying?: boolean;
  you?: boolean;
}

export type Difficulty = 'normal' | 'hard' | 'hell';

export interface RoomOptions {
  difficulty: Difficulty;
  textSeconds: number;
  imageSeconds: number;
  rounds: number;
  teamMode: boolean;
  fixedDrawer: boolean;
  /** 고정 출제자가 누구인지 — players 배열의 인덱스 */
  fixedDrawerIndex: number;
  scored: boolean;
}

export interface RoomState {
  code: string;
  name: string;
  isPublic: boolean;
  status: RoomStatus;
  mode: GameMode;
  teamGame: boolean;
  options: RoomOptions;
  maxPlayers: number;
  players: Player[];
  you: Player | null;
  game?: Record<string, any>;
  results?: Record<string, any>;
}
