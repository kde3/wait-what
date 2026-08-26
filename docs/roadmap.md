# AI 갈틱폰 — 작업 인계

다른 AI가 이어서 작업할 수 있도록 정리한 문서. 기능 체크리스트는 `AI 갈틱폰 QA, 기능 리스트.md` 참고.

---

## 1. 프로젝트 개요

**리포지토리**: `D:\workspace\ai-garticphone`

AI 이미지 생성을 이용한 갈틱폰류 파티 게임. 익명 사용자 기반이며 로그인이 없다.

### 구조

```
backend/          Express + ws (게임 상태의 단일 진실 원천)
  lib/store.ts      방·플레이어·게임 로직 (모드별 init/adv)
  lib/serialize.ts  플레이어별 상태 직렬화 (공개 범위가 사람마다 다름)
  lib/realtime.ts   웹소켓 브로드캐스트 + 250ms 틱
  lib/ai.ts         외부 AI 이미지 API 클라이언트
  lib/images.ts     생성 이미지 인메모리 저장 + 서빙
  routes.ts         REST 엔드포인트

frontend/         Next.js (App Router) + HeroUI + Tailwind
  app/              라우트 (페이지 = 데이터·라우팅 책임)
  views/            화면 조립 (프레젠테이션)
  components/       game · game/modes · home · layout · room · ui
  hooks/            use-countdown · use-draft · use-generate · use-realtime
  stories/          스토리북 (폴더 구조와 1:1)
  lib/i18n.ts       ko/en/ja/zh + lib/locales/*.ts 8개 언어
```

### 실행

```bash
npm run dev:backend     # 3001
npm run dev:frontend    # 3000
npm run storybook       # 6006
```

포트는 `backend/.env.dev`(`PORT`, `CORS_ORIGIN`)와 `frontend/.env.development`(`NEXT_PUBLIC_BACKEND_URL`)가 서로 맞아야 한다. **env를 기준으로 삼을 것.**

---

## 2. 반드시 지킬 것

작업 전에 이 항목들을 먼저 읽을 것. 어기면 되돌리는 비용이 크다.

### 코드 스타일

- **새 코드에 주석을 달지 않는다.** 기존 주석은 유지. 사용자의 명시적 지시.
- 기존 파일의 컨벤션(네이밍·구조)을 따른다.

### 건드리면 안 되는 것

- `frontend/components/ui/base.tsx`는 유틸이라 스토리를 만들지 않는다.

### 보안

- **`playerId`는 행위 인증 토큰이다.** 모든 POST가 `req.body.playerId`로 행위자를 식별한다. 따라서 **다른 플레이어의 id를 클라이언트로 절대 내려보내지 않는다.** 본인 여부는 서버가 계산한 불리언(`you: p.id === playerId`)으로 전달한다. `serialize.ts` 전체가 이 규칙을 지키고 있다.
- AI 서버 키(`AI_SERVER_*`)는 `backend/.env*`에만 둔다. 프론트엔드(`NEXT_PUBLIC_*`)에 절대 넣지 않는다.

### 이미지 URL

백엔드는 `/api/image/<id>` 같은 **상대경로**를 준다. 프론트엔드에서 `<img src>`에 쓸 때는 **반드시 `apiUrl()`을 거쳐야 한다.** 안 그러면 프론트 오리진(3000)으로 풀려 404가 난다. `lib/backend-url.ts`의 `apiUrl()`은 절대 URL(`http:`/`data:`/`blob:`)은 그대로 통과시킨다.

---

## 3. 현재 상태

### 게임 모드 (5개)

`classic` · `speed` · `speed_team` · `coop` · `imposter`

- **릴레이 그림 수정 모드는 제거됨** (수정 API 품질 문제)
- **임포스터 사회자 옵션도 제거됨** (전원 참여, 최소 3명)

### AI 연동

| API | 상태 |
|---|---|
| `POST /generate` | 사용 중. **모든 그림은 항상 생성**한다 |
| `POST /edit` | **사용 안 함.** 코드 제거됨 (API 자체가 폐기 예정) |
| `POST /evaluate` | `ai.ts`에 `evaluateImage()`가 남아 있으나 **호출부 없음** |

`/evaluate`는 릴레이 모드 전용이었는데 모드가 사라지면서 소비처를 잃었다. 협동 모드에 붙이려면 여러 명이 나눠 그린 조각을 **하나로 합성**해야 하는데, 서버에 합성 이미지가 없어 이미지 라이브러리(sharp 등) 도입이 선행되어야 한다.

키가 없으면 목업 이미지로 자동 폴백하므로 키 없이도 개발이 가능하다.

### 주요 규칙값

| 값 | 위치 | 설명 |
|---|---|---|
| `MAX_PLAYERS = 12` | `store.ts` | 방 정원. 서버가 클라이언트에 `maxPlayers`로 내려준다 |
| `RECONNECT_GRACE_MS = 3000` | `realtime.ts` | 재접속 유예. 이 시간이 지나야 "나갔다"고 판정 |

**인원 판정은 소켓이 아니라 명단(`room.players`) 기준이다.** 소켓이 끊겨도 유예 시간 안에 돌아오면 계속 방에 있는 것으로 본다. 홈 목록 인원수·정원 판정 모두 명단을 본다.

방 생성/입장 시에도 유예 타이머를 건다. HTTP로 join만 하고 웹소켓을 안 여는 경우 자리를 영구 점유하는 것을 막기 위함이다.

### 중퇴 처리

유예가 지나면 명단에서 제거된다. 게임 중이어도 마찬가지이며 **진행 중인 판에는 재입장할 수 없다**(`errAlreadyStarted`).

- 방장이 나가면 `room.players[0]`이 승계한다
- 팀 전멸 시 남은 팀만으로 계속 진행한다 (유령이 잡은 차례는 즉시 건너뜀)
- 임포스터 전멸 → 시민 승리 / 시민 전멸 → 임포스터 승리
- **중퇴자 닉네임은 `room.names`에 스냅샷으로 남는다.** 결과 갤러리에서 `?` 대신 이름이 보이도록 `nicknameOf(room, id)`를 거친다

---

## 4. 스토리북 규칙 (확립됨)

**사이드바 섹션 = 실제 폴더 구조.** 예외는 `Foundations` 하나뿐.

| 섹션 | 대응 폴더 |
|---|---|
| `Game/*` | `components/game`, `components/game/modes` |
| `Home/*` | `components/home` |
| `Layout/*` | `components/layout` |
| `Room/*` | `components/room` |
| `UI/*` | `components/ui` |
| `Views/*` | `views/` |
| `Foundations/*` | 예외 — 컬러 팔레트 등 |

### 원칙

- **한 파일 = 한 컴포넌트 = 한 스토리.** 여러 컴포넌트가 한 파일에 있으면 분리부터 한다.
- **훅은 스토리를 만들지 않는다.** `hooks/`로 뺀다.
- `Game/*`는 컴포넌트 단독 상태 비교용. `Views/Room`은 헤더까지 붙은 **최종 화면**(로비 / 모드별 진행중 / 모드별 결과).
- 목업은 `stories/mocks/room-states.ts`(로비·클래식)와 `stories/mocks/game-states.ts`(모드별)에 둔다.
- 테마 토글이 툴바에 있다. URL로도 고정 가능: `?globals=theme:dark`

### 이번에 정리한 것

`game-play.tsx`(596줄, 모드 5개)와 `game-bits.tsx`(171줄, 컴포넌트 5개 + 훅 2개)를 개별 파일로 분리하고 각각 스토리를 붙였다. 현재 스토리 수:

```
Foundations 3 · Game 46 · Home 5 · Layout 3 · Room 16 · UI 26 · Views 22
```

---

## 5. 다음에 할 일

### ① 남은 컴포넌트 분리 + 스토리 추가

프로젝트를 **처음부터 다시 훑어서** 한 파일에 여러 컴포넌트가 들어 있는 곳을 찾아 분리하고, 스토리북에 1:1로 추가한다.

`components/game`은 이번에 정리했으나 **`room`·`views`·`app` 등 나머지는 미검증**이다. 특히 `components/room/room.tsx`는 내부에 `OptionSelect`·`OptionSwitch`·`DifficultySelect`·`PlayerSelect` 같은 로컬 컴포넌트를 여러 개 갖고 있어 분리 대상으로 보인다.

### ② 중복 컴포넌트 일반화 → `ui/`로

**같은 것을 서로 다르게 구현한 곳**을 찾아 일반화한다. 공통 컴포넌트를 `components/ui/`에 만들고 사용처가 모두 그것을 쓰게 바꿔 **스타일을 일치**시킨다. 그리고 스토리북에서 관리한다.

후보 예시:
- 여러 화면에 흩어진 옵션 선택기(`OptionSelect` / `DifficultySelect` / `PlayerSelect`)
- 스피너 + 문구 조합의 상태 배너 (재연결 배너, 제출 완료 배너, 머무르기 대기 배너가 각각 따로 구현되어 있음)
- 모달 (`invite-modal` / `exit-modal`이 HeroUI `Modal` 조합을 각각 반복)

### ③ Foundations에 에셋 추가

폰트 · 이미지 · 사운드 · 파비콘 섹션을 `Foundations`에 만들어 **에셋도 스토리북에서 관리**한다.

현재 에셋 위치:
```
frontend/public/
  fonts/     Mona, Pretendard
  images/    logo.png, mock-image.png, characters/(과일 8종), illustration/
  sounds/    bgm/(home, play), sfx/(button, game-over 등)
  favicon.ico
```

### ④ AGENTS.md 작성

리포지토리 루트에 `AGENTS.md`를 만들어 지침을 못 박는다. **현재 이 파일은 존재하지 않는다.**

핵심 문장:

> 모든 프론트엔드 에셋과 컴포넌트는 스토리북으로 볼 수 있게 한다.

여기에 위 **2번(반드시 지킬 것)** 과 **4번(스토리북 규칙)** 내용을 함께 옮겨 담아, 어떤 AI가 읽어도 같은 방식으로 작업하도록 한다.

### ⑤ QA 리스트 기반 테스트 코드

`AI 갈틱폰 QA, 기능 리스트.md`의 항목을 보고 테스트 코드를 작성한다.

- 대부분은 **외부 API를 목업**으로 처리
- **몇 개만 e2e로 실제 외부 AI API를 호출**해 연동을 검증

---

## 6. 알아두면 좋은 함정

작업하다 실제로 겪은 것들.

**`.next` 캐시 손상** — dev 서버를 켜둔 채 브랜치를 옮기거나 파일을 대량 교체하면 빌드 캐시가 깨진다. 증상은 특정 라우트만 500이 나고 로그에 `Cannot find module '.next/server/pages/_document.js'`가 찍히는 것. 코드 문제가 아니므로 `rm -rf frontend/.next` 후 재시작하면 된다.

**백엔드 포트** — `backend/.env.dev`에 `PORT=3001`이 없으면 기본값 3000으로 떠서 프론트엔드와 충돌한다.

**스토리북 지연 컴파일** — Vite가 스토리를 처음 열 때 컴파일하므로, 자동 검증 스크립트에서 짧게 기다리면 빈 화면으로 오판한다. `iframe.html?id=...`에 직접 접근하면 매니저 간섭 없이 단독 렌더를 확인할 수 있다.

**협동 모드 크래시(수정 완료)** — `realtime.ts`의 `stateKey`가 그룹 구조를 relay 모양으로 가정해서, 협동 게임을 시작하면 **서버 프로세스 전체가 죽었다.** 지금은 고쳤지만, 모드별로 게임 상태 구조가 다르다는 점은 계속 주의할 것.

**모바일 배경음악** — `visibilitychange` / `pagehide` / `pageshow` / `freeze` 네 이벤트를 모두 걸어야 iOS 사파리에서 백그라운드 재생이 멈춘다. `lib/sound.ts` 참고.

---

## 7. 검증 방법

이 프로젝트는 자동화된 테스트가 아직 없다(⑤번 작업 대상). 그래서 변경 후에는 다음을 직접 확인해왔다.

```bash
npm --prefix backend run typecheck
npm --prefix frontend run typecheck
```

백엔드 동작은 `ws` 패키지로 소켓을 열고 REST를 호출하는 임시 Node 스크립트로 검증했다. **HTTP로 방을 만들거나 입장만 하고 웹소켓을 열지 않으면 3초 뒤 방이 사라지므로**, 테스트 스크립트는 반드시 소켓을 유지해야 한다.
