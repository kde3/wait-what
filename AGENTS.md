# AGENTS.md

이 리포지토리에서 작업하는 모든 AI 에이전트가 따라야 하는 지침. 프로젝트 개요와 인계 내용은 `docs/roadmap.md`, 기능 체크리스트는 `docs/checklist.md` 참고.

> **모든 프론트엔드 에셋과 컴포넌트는 스토리북으로 볼 수 있게 한다.**

---

## 반드시 지킬 것

어기면 되돌리는 비용이 크다. 작업 전에 먼저 읽을 것.

### 코드 스타일
- 기존 파일의 컨벤션(네이밍·구조)을 따른다.

### 건드리면 안 되는 것
- `frontend/components/ui/base.tsx`는 유틸이라 스토리를 만들지 않는다.

### 보안

- **`playerId`는 행위 인증 토큰이다.** 모든 POST가 `req.body.playerId`로 행위자를 식별한다. 따라서 **다른 플레이어의 id를 클라이언트로 절대 내려보내지 않는다.** 본인 여부는 서버가 계산한 불리언(`you: p.id === playerId`)으로 전달한다. `backend/lib/serialize.ts` 전체가 이 규칙을 지키고 있다.
- AI 서버 키(`AI_SERVER_*`)는 `backend/.env*`에만 둔다. 프론트엔드(`NEXT_PUBLIC_*`)에 절대 넣지 않는다.

### 이미지 URL

백엔드는 `/api/image/<id>` 같은 **상대경로**를 준다. 프론트엔드에서 `<img src>`에 쓸 때는 **반드시 `apiUrl()`을 거쳐야 한다.** 안 그러면 프론트 오리진(3000)으로 풀려 404가 난다. `frontend/lib/backend-url.ts`의 `apiUrl()`은 절대 URL(`http:`/`data:`/`blob:`)은 그대로 통과시킨다.

---

## 스토리북 규칙

**사이드바 섹션 = 실제 폴더 구조.** 예외는 `Foundations` 하나뿐.

| 섹션 | 대응 폴더 |
|---|---|
| `Game/*` | `components/game`, `components/game/modes` |
| `Home/*` | `components/home` |
| `Layout/*` | `components/layout` |
| `Room/*` | `components/room` |
| `UI/*` | `components/ui` |
| `Views/*` | `views/` |
| `Foundations/*` | 예외 — 컬러 팔레트 · 폰트 · 이미지 · 사운드 · 파비콘 등 에셋 |

### 원칙

- **한 파일 = 한 컴포넌트 = 한 스토리.** 여러 컴포넌트가 한 파일에 있으면 분리부터 한다.
- **훅은 스토리를 만들지 않는다.** `hooks/`로 뺀다.
- 새 컴포넌트를 만들면 같은 위치 규칙으로 스토리를 함께 추가한다. 에셋(폰트·이미지·사운드·파비콘)을 추가하면 `Foundations/*` 스토리에도 반영한다.
- **같은 UI를 두 번 구현하지 않는다.** 반복되는 패턴은 `components/ui/`로 일반화하고 사용처가 모두 그것을 쓰게 한다. (예: `OptionSelect` · `Switch` · `Spinner` · `StatusBanner` · `Modal`)
- `Game/*`는 컴포넌트 단독 상태 비교용. `Views/Room`은 헤더까지 붙은 **최종 화면**(로비 / 모드별 진행중 / 모드별 결과).
- 목업은 `stories/mocks/room-states.ts`(로비·클래식)와 `stories/mocks/game-states.ts`(모드별)에 둔다.
- 백엔드를 부르는 훅은 `.storybook/preview.tsx`의 `sb.mock()`이 `hooks/__mocks__/`로 우회시킨다. 스토리에서 `mocked(...)`로 반환값을 지정한다.
- 테마 토글이 툴바에 있다. URL로도 고정 가능: `?globals=theme:dark`

---

## 실행 · 검증

```bash
npm run dev:backend     # 3001
npm run dev:frontend    # 3000
npm run storybook       # 6006
```

포트는 `backend/.env.dev`(`PORT`, `CORS_ORIGIN`)와 `frontend/.env.development`(`NEXT_PUBLIC_BACKEND_URL`)가 서로 맞아야 한다.

변경 후에는 반드시 확인한다:

```bash
npm --prefix backend run typecheck
npm --prefix frontend run typecheck
npm --prefix backend run test
npm --prefix frontend run test
```

실제 외부 AI API 연동 검증은 `npm --prefix backend run test:e2e` (backend/.env.dev의 키 필요).

HTTP로 방을 만들거나 입장만 하고 웹소켓을 열지 않으면 재접속 유예(3초) 뒤 방이 사라진다. 백엔드를 수동 검증하는 스크립트는 반드시 소켓을 유지해야 한다.
