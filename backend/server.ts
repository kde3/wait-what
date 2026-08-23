import { createServer } from 'node:http';
import express from 'express';
import { WebSocket, WebSocketServer } from 'ws';
import { apiRouter } from './routes.js';
import { deleteRoom } from './lib/store.js';
import { LOBBY, touch } from './lib/realtime.js';

const port = Number.parseInt(process.env.PORT || '3000', 10);
// HOSTNAME은 Git Bash와 컨테이너 런타임이 제멋대로 채우므로 쓰지 않는다. 미지정 시 전 인터페이스(IPv4+IPv6) 바인딩.
const hostname = process.env.HOST || undefined;
const allowedOrigins = (process.env.CORS_ORIGIN ?? '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);
type GameSocket = WebSocket & { gpCode?: string; gpPlayerId?: string; gpAlive?: boolean };

const sockets: Map<string, Set<GameSocket>> = globalThis.__gpSockets ?? (globalThis.__gpSockets = new Map());
const dirty: Set<string> = globalThis.__gpDirty ?? (globalThis.__gpDirty = new Set());
const emptyRoomTimers = new Map<string, ReturnType<typeof setTimeout>>();
let server;

async function main() {
  const expressApp = express();
  expressApp.disable('x-powered-by');
  expressApp.use((req, res, nextMiddleware) => {
    const origin = req.headers.origin?.replace(/\/+$/, '');
    const allowAnyOrigin = allowedOrigins.includes('*');
    if (origin && (allowAnyOrigin || allowedOrigins.includes(origin))) {
      res.setHeader('Access-Control-Allow-Origin', allowAnyOrigin ? '*' : origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    nextMiddleware();
  });
  expressApp.use(express.json({ limit: '32kb' }));
  expressApp.get('/health', (_req, res) => res.status(200).json({ ok: true }));
  expressApp.use('/api', apiRouter);
  expressApp.use((_req, res) => res.status(404).json({ error: 'Not found' }));

  server = createServer(expressApp);
  const wss = new WebSocketServer({ noServer: true, maxPayload: 4096 });

  server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'internal'}`);
  if (url.pathname !== '/ws') {
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (rawSocket) => {
    const ws = rawSocket as GameSocket;
    const code = String(url.searchParams.get('code') || '').toUpperCase().slice(0, 16);
    if (!code) return ws.close(1008, 'code required');
    ws.gpCode = code;
    ws.gpPlayerId = String(url.searchParams.get('playerId') || '').slice(0, 32);
    ws.gpAlive = true;
    const roomSockets = sockets.get(code) ?? new Set();
    sockets.set(code, roomSockets);
    roomSockets.add(ws);
    touch(LOBBY);
    const pendingRemoval = emptyRoomTimers.get(code);
    if (pendingRemoval) {
      clearTimeout(pendingRemoval);
      emptyRoomTimers.delete(code);
    }
    dirty.add(code);
    ws.on('pong', () => { ws.gpAlive = true; });
    ws.on('error', () => {});
    ws.on('close', () => {
      roomSockets.delete(ws);
      touch(LOBBY);
      if (!roomSockets.size) {
        sockets.delete(code);
        const timer = setTimeout(() => {
          emptyRoomTimers.delete(code);
          if (sockets.get(code)?.size) return;
          if (deleteRoom(code)) touch(LOBBY);
        }, 5_000);
        emptyRoomTimers.set(code, timer);
      }
    });
  });
  });

const heartbeat = setInterval(() => {
  for (const roomSockets of sockets.values()) for (const ws of roomSockets) {
    if (ws.gpAlive === false) ws.terminate();
    else { ws.gpAlive = false; try { ws.ping(); } catch {} }
  }
}, 30_000);
heartbeat.unref?.();

  server.listen(port, hostname, () => {
    console.log(`> Express ready on ${hostname ?? '0.0.0.0'}:${port} (ws: /ws)`);
  });
}

const shutdown = () => server?.close(() => process.exit(0));
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
