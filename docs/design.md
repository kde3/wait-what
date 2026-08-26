# 디자인 규칙

## 컴포넌트

- 컴포넌트는 **HeroUI**(`@heroui/react`)를 기반으로 만든다.
- 반복해서 쓰는 조합은 `components/ui/`에 래퍼로 두고, 화면에서는 그 래퍼를 쓴다.

## 아이콘

- **`pixelarticons`**(`pixelarticons/react`)를 쓴다. 텍스트나 이모지로 아이콘을 대신하지 않는다.
- 글자 옆에 붙는 아이콘은 글자 크기를 따라가도록 한다.

```tsx
import { Check } from 'pixelarticons/react';

<Check className="inline-block size-[1em] align-[-0.125em]" aria-hidden="true" />
```

- 아이콘만 있는 버튼에는 `aria-label`을 반드시 준다. 장식용 아이콘에는 `aria-hidden="true"`를 준다.

## 폰트

두 벌을 역할로 나눠 쓴다. 정의는 `frontend/app/globals.css`에 있다.

| 토큰 | 폰트 | 쓰이는 곳 |
|---|---|---|
| `--font-brand` / `--font-heading` / `--font-sans` | **Mona** | 기본 UI, 제목, 버튼, 라벨 |
| `--font-description` | **Pretendard** | 설명문, 보조 문구 |

## 색

- 색은 CSS 변수(`--palette-*`)로만 쓰고 컴포넌트에 값을 직접 박지 않는다.
- 라이트/다크는 `globals.css`의 `:root`와 `.dark, [data-theme="dark"]` 두 블록에서 갈린다.
- **다크에서 재정의되지 않는 변수가 있다.** 예를 들어 `--palette-ink`는 라이트 블록에만 있어서, 다크 배경 위에 쓰면 대비가 사라진다. 새 색을 쓸 때는 양쪽 테마에서 실제로 보이는지 확인한다.
- 팔레트는 스토리북 `Foundations/Colors`에서 볼 수 있다.
