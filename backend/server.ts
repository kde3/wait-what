import { createServer } from 'node:http';
import express from 'express';
import { WebSocket, WebSocketServer } from 'ws';
import { apiRouter } from './routes.js';
import { HOME, touch, scheduleLeave, cancelLeave, hasLiveSocket } from './lib/realtime.js';

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
let server;

async function main() {
  const expressApp = express();
  expressApp.disable('x-powered-by');
  expressApp.use((req, res, nextMiddleware) => {
    const origin = req.headers.origin?.replace(/\/+$/, '');
    const allowAnyOrigin = allowedOrigins.includes('*');
    // 허용 여부와 무관하게 항상 보낸다. 거부한 응답에 Vary가 없으면 캐시가 그 응답을
    // 다른 오리진에도 재사용해, 엉뚱한 Access-Control-Allow-Origin이 돌아온다.
    res.setHeader('Vary', 'Origin');
    if (origin && (allowAnyOrigin || allowedOrigins.includes(origin))) {
      res.setHeader('Access-Control-Allow-Origin', allowAnyOrigin ? '*' : origin);
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
    touch(HOME);
    if (ws.gpPlayerId) cancelLeave(code, ws.gpPlayerId);
    dirty.add(code);
    ws.on('pong', () => { ws.gpAlive = true; });
    ws.on('error', () => {});
    ws.on('close', () => {
      roomSockets.delete(ws);
      touch(HOME);
      if (ws.gpPlayerId && !hasLiveSocket(code, ws.gpPlayerId)) scheduleLeave(code, ws.gpPlayerId);
      if (!roomSockets.size) sockets.delete(code);
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
