import type { WebSocket } from 'ws';

type GameSocket = WebSocket & { gpCode?: string; gpPlayerId?: string; gpAlive?: boolean };

declare global {
  var __gpSockets: Map<string, Set<GameSocket>> | undefined;
  var __gpDirty: Set<string> | undefined;
  var __gpTicker: ReturnType<typeof setInterval> | undefined;
}

export {};
