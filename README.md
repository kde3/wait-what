# AI 갈틱폰

## 구조

- `frontend/`: Next.js App Router UI, 클라이언트 컴포넌트, 스타일과 정적 파일
- `backend/`: Express API, 게임 상태/직렬화 로직, WebSocket 서버

Express가 단일 포트에서 `/api/*`와 `/ws`를 처리하고, 그 외 요청은 Next.js 프론트엔드로 전달합니다.

## 실행

```bash
npm install
npm run dev
```

- 웹: `http://localhost:3000`
- REST API: `http://localhost:3000/api`
- WebSocket: `ws://localhost:3000/ws`

프로덕션 빌드와 실행:

```bash
npm run build
npm start
```
