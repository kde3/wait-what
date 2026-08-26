import { createGameServer } from './app.js';

const port = Number.parseInt(process.env.PORT || '3000', 10);
// HOSTNAME은 Git Bash와 컨테이너 런타임이 제멋대로 채우므로 쓰지 않는다. 미지정 시 전 인터페이스(IPv4+IPv6) 바인딩.
const hostname = process.env.HOST || undefined;
let server;

async function main() {
  server = createGameServer();
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
