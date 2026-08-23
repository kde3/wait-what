import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

interface ColorGroup {
  title: string;
  tokens: string[];
}

const groups: ColorGroup[] = [
  {
    title: '브랜드 그린',
    tokens: [
      '--palette-green-500',
      '--palette-green-600',
      '--palette-green-550',
      '--palette-green-700',
      '--palette-green-900',
    ],
  },
  {
    title: '배경 · 서피스',
    tokens: [
      '--palette-surface-page',
      '--palette-surface-tint',
      '--palette-surface-card',
      '--palette-surface-soft',
      '--palette-surface-muted',
    ],
  },
  {
    title: '보더',
    tokens: [
      '--palette-border-subtle',
      '--palette-border-soft',
      '--palette-border-accent-soft',
      '--palette-border-accent',
    ],
  },
  {
    title: '보조 서피스 · 컨트롤',
    tokens: [
      '--palette-control-surface',
      '--palette-control-hover',
      '--palette-control-pressed',
      '--palette-control-tint',
      '--palette-control-active',
      '--palette-control-disabled',
      '--palette-control-foreground',
    ],
  },
  {
    title: '텍스트',
    tokens: [
      '--palette-text-primary',
      '--palette-text-secondary',
      '--palette-text-muted',
      '--palette-text-disabled',
    ],
  },
  {
    title: '포인트 · 순위 · 상태',
    tokens: [
      '--palette-point-lime',
      '--palette-point-lime-strong',
      '--palette-point-foreground',
      '--palette-rank-gold',
      '--palette-rank-silver',
      '--palette-rank-bronze',
      '--palette-state-orange',
    ],
  },
  {
    title: '일러스트',
    tokens: [
      '--palette-illustration-sky',
      '--palette-illustration-green-light',
      '--palette-illustration-green',
      '--palette-illustration-leaf',
      '--palette-illustration-lime',
    ],
  },
];

const allTokens = groups.flatMap((group) => group.tokens);

const UNDEFINED_LABEL = '정의되지 않음';

/* 값을 복사해두지 않고 globals.css에 선언된 실제 값을 읽는다. 스토리와 토큰이 어긋날 수 없다. */
function useResolvedPalette(): Record<string, string> {
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const read = () => {
      const computed = getComputedStyle(document.documentElement);
      setValues(
        Object.fromEntries(
          allTokens.map((token) => [token, computed.getPropertyValue(token).trim().toUpperCase()]),
        ),
      );
    };

    read();

    // HMR로 globals.css가 다시 주입되면 값을 새로 읽는다.
    const observer = new MutationObserver(read);
    observer.observe(document.head, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return values;
}

function ColorPalette() {
  const values = useResolvedPalette();
  const total = allTokens.length;

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">AI 갈틱폰 컬러 팔레트</h1>
          <p className="text-sm text-muted">globals.css에 보관된 브랜드 팔레트 토큰 · 총 {total}개</p>
        </header>

        {groups.map((group) => (
          <section key={group.title} className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">{group.title}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {group.tokens.map((token) => {
                const value = values[token] || UNDEFINED_LABEL;

                return (
                  <article key={token} className="flex items-center gap-4 rounded-2xl border bg-surface p-4 shadow-sm">
                    <div
                      className="size-20 shrink-0 rounded-full border shadow-sm"
                      style={{ backgroundColor: `var(${token})` }}
                      aria-label={`${value} 색상 미리보기`}
                    />
                    <div className="min-w-0 space-y-1">
                      <p className="break-all text-sm font-medium text-foreground">{token}</p>
                      <p className="text-sm text-muted">{value}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

const meta = {
  title: 'Foundations/Colors',
  component: ColorPalette,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ColorPalette>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Palette: Story = {};
