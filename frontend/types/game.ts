import type { GameMode } from './room';

export interface GameViewState {
  kind: GameMode;
  remaining?: number;
  round?: number;
  phase?: string;
  [key: string]: unknown;
}
