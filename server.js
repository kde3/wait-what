// Next.js + WebSocket 커스텀 서버.
//
// Next의 API 라우트는 요청/응답 한 쌍으로 끝나서 연결을 붙들 수 없다. 그래서 HTTP 서버를 직접 만들어
// 일반 요청은 Next에 넘기고, /ws 업그레이드만 가로채 웹소켓으로 승격시킨다.
//
// 이 파일은 Node가 직접 실행하므로 CommonJS다. 게임 로직(ESM)을 여기서 import할 수 없기 때문에
// 여기서는 소켓 등록만 하고, 실제 상태 직렬화와 전송은 lib/realtime.js가 globalThis를 통해 처리한다.
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { WebSocketServer } = require('ws');

const dev = !process.argv.includes('--prod') && process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3000', 10);
const hostname = process.env.HOSTNAME || undefined;

const app = next({ dev });
const handle = app.getRequestHandler();

// lib/realtime.js와 공유하는 레지스트리
const sockets = globalThis.__gpSockets ?? (globalThis.__gpSockets = new Map()); // code -> Set<ws>
const dirty = globalThis.__gpDirty ?? (globalThis.__gpDirty = new Set());

const HEARTBEAT_MS = 30000;

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res, parse(req.url, true));
  });

  const wss = new WebSocketServer({ noServer: true, maxPayload: 4096 });
  // 우리가 upgrade 리스너를 달면 Next의 HMR 웹소켓도 여기로 온다.
  // 넘겨주지 않으면 소켓이 응답 없이 쌓여 서버가 멈추므로 반드시 위임해야 한다.
  const nextUpgrade = typeof app.getUpgradeHandler === 'function' ? app.getUpgradeHandler() : null;

  server.on('upgrade', (req, socket, head) => {
    let pathname, query;
    try {
      ({ pathname, query } = parse(req.url, true));
    } catch {
      socket.destroy();
      return;
    }

    if (pathname !== '/ws') {
      if (nextUpgrade) nextUpgrade(req, socket, head);
      else socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      const code = String(query.code || '').toUpperCase().slice(0, 16);
      if (!code) {
        ws.close(1008, 'code required');
        return;
      }
      ws.gpCode = code;
      ws.gpPlayerId = String(query.playerId || '').slice(0, 32);
      ws.gpAlive = true;

      let set = sockets.get(code);
      if (!set) {
        set = new Set();
        sockets.set(code, set);
      }
      set.add(ws);

      // 접속 직후 현재 상태를 한 번 받도록 표시 (다음 틱에 realtime이 밀어준다)
      dirty.add(code);

      ws.on('pong', () => {
        ws.gpAlive = true;
      });
      ws.on('error', () => {});
      ws.on('close', () => {
        set.delete(ws);
        if (!set.size) sockets.delete(code);
      });
    });
  });

  // 끊긴 걸 눈치 못 챈 소켓 정리
  const heartbeat = setInterval(() => {
    for (const set of sockets.values()) {
      for (const ws of set) {
        if (ws.gpAlive === false) {
          ws.terminate();
          continue;
        }
        ws.gpAlive = false;
        try {
          ws.ping();
        } catch {}
      }
    }
  }, HEARTBEAT_MS);
  heartbeat.unref?.();

  server.listen(port, hostname, () => {
    console.log(`> ready on http://localhost:${port}  (ws: /ws, ${dev ? 'dev' : 'production'})`);
  });
});
