export type GameMode = 'classic' | 'speed' | 'speed_team' | 'relay' | 'coop' | 'imposter';
export type RoomStatus = 'lobby' | 'playing' | 'finished';

export interface Player {
  nickname: string;
  isHost: boolean;
  team: number | null;
  score: number;
}

export interface RoomOptions {
  textSeconds: number;
  imageSeconds: number;
  rounds: number;
  teamMode: boolean;
  fixedDrawer: boolean;
  scored: boolean;
  moderator: boolean;
}

export interface RoomState {
  code: string;
  name: string;
  isPublic: boolean;
  status: RoomStatus;
  mode: GameMode;
  teamGame: boolean;
  options: RoomOptions;
  players: Player[];
  you: Player | null;
  game?: Record<string, any>;
  results?: Record<string, any>;
}
