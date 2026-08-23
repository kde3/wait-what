import { useEffect, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

interface ColorGroup {
  title: string;
  tokens: string[];
}

const groups: ColorGroup[] = [
  {
    title: '주요컬러',
    tokens: [
      '--palette-primary',
      '--palette-primary-strong',
      '--palette-secondary',
      '--palette-secondary-strong',
      '--palette-ink',
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
      '--palette-point',
      '--palette-point-strong',
      '--palette-point-foreground',
      '--palette-rank-gold',
      '--palette-rank-silver',
      '--palette-rank-bronze',
      '--palette-state-alert',
      '--palette-state-success',
    ],
  },
];

const allTokens = groups.flatMap((group) => group.tokens);

const UNDEFINED_LABEL = '정의되지 않음';

type Mode = 'light' | 'dark';

function useResolvedPalette(scopeRef: { current: HTMLElement | null }): Record<string, string> {
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const read = () => {
      const scope = scopeRef.current;
      if (!scope) return;
      const computed = getComputedStyle(scope);
      setValues(
        Object.fromEntries(
          allTokens.map((token) => [token, computed.getPropertyValue(token).trim().toUpperCase()]),
        ),
      );
    };

    read();

    const observer = new MutationObserver(read);
    observer.observe(document.head, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [scopeRef]);

  return values;
}

function Swatch({ token, value }: { token: string; value: string }) {
  return (
    <article className="flex items-center gap-4 rounded-2xl border bg-surface p-4 shadow-sm">
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
}

function PaletteScope({ mode, columns }: { mode: Mode; columns: string }) {
  const scopeRef = useRef<HTMLElement | null>(null);
  const values = useResolvedPalette(scopeRef);

  return (
    <main
      ref={scopeRef}
      className={`${mode} min-h-screen bg-background px-4 py-10 sm:px-8`}
      data-theme={mode}
    >
      <div className="mx-auto w-full max-w-7xl space-y-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            컬러 팔레트 · {mode === 'dark' ? '다크' : '라이트'}
          </h1>
          <p className="text-sm text-muted">
            globals.css에 보관된 브랜드 팔레트 토큰 · 총 {allTokens.length}개
          </p>
        </header>

        {groups.map((group) => (
          <section key={group.title} className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">{group.title}</h2>
            <div className={`grid gap-4 ${columns}`}>
              {group.tokens.map((token) => (
                <Swatch key={token} token={token} value={values[token] || UNDEFINED_LABEL} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

function ColorPalette() {
  return <PaletteScope mode="light" columns="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" />;
}

const meta = {
  title: 'Foundations/Colors',
  component: ColorPalette,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ColorPalette>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Palette: Story = {};

export const Dark: Story = {
  render: () => <PaletteScope mode="dark" columns="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" />,
};

export const Compare: Story = {
  render: () => (
    <div className="grid md:grid-cols-2">
      <PaletteScope mode="light" columns="sm:grid-cols-2" />
      <PaletteScope mode="dark" columns="sm:grid-cols-2" />
    </div>
  ),
};
