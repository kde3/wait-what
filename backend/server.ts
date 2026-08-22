import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import next from 'next';
import { WebSocket, WebSocketServer } from 'ws';
import { apiRouter } from './routes.js';

const backendDir = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(backendDir, '../frontend');
const dev = !process.argv.includes('--prod') && process.env.NODE_ENV !== 'production';
const port = Number.parseInt(process.env.PORT || '3000', 10);
const hostname = process.env.HOSTNAME || undefined;
type GameSocket = WebSocket & { gpCode?: string; gpPlayerId?: string; gpAlive?: boolean };

const sockets: Map<string, Set<GameSocket>> = globalThis.__gpSockets ?? (globalThis.__gpSockets = new Map());
const dirty: Set<string> = globalThis.__gpDirty ?? (globalThis.__gpDirty = new Set());
let server;

async function main() {
  const nextApp = next({ dev, dir: frontendDir });
  await nextApp.prepare();

  const expressApp = express();
  expressApp.disable('x-powered-by');
  expressApp.use(express.json({ limit: '32kb' }));
  expressApp.use('/api', apiRouter);
  expressApp.use((req, res) => nextApp.getRequestHandler()(req, res));

  server = createServer(expressApp);
  const wss = new WebSocketServer({ noServer: true, maxPayload: 4096 });
  const nextUpgrade = typeof nextApp.getUpgradeHandler === 'function' ? nextApp.getUpgradeHandler() : null;

  server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  if (url.pathname !== '/ws') {
    if (nextUpgrade) nextUpgrade(req, socket, head);
    else socket.destroy();
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
    dirty.add(code);
    ws.on('pong', () => { ws.gpAlive = true; });
    ws.on('error', () => {});
    ws.on('close', () => {
      roomSockets.delete(ws);
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
    console.log(`> Express ready on http://localhost:${port} (Next frontend, ws: /ws, ${dev ? 'dev' : 'production'})`);
  });
}

const shutdown = () => server?.close(() => process.exit(0));
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
