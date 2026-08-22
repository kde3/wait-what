import type { Meta, StoryObj } from '@storybook/react';

interface ColorToken {
  name: string;
  value: string;
}

interface ColorGroup {
  title: string;
  colors: ColorToken[];
}

const groups: ColorGroup[] = [
  {
    title: '브랜드 그린',
    colors: [
      { name: '--palette-green-500', value: '#6ABF7C' },
      { name: '--palette-green-600', value: '#4FA463' },
      { name: '--palette-green-550', value: '#56B26B' },
      { name: '--palette-green-700', value: '#3F9455' },
      { name: '--palette-green-900', value: '#2F6B45' },
    ],
  },
  {
    title: '배경 · 서피스',
    colors: [
      { name: '--palette-surface-page', value: '#F7FCF7' },
      { name: '--palette-surface-tint', value: '#E4F3E7' },
      { name: '--palette-surface-card', value: '#FFFFFF' },
      { name: '--palette-surface-soft', value: '#F5FAF5' },
      { name: '--palette-surface-muted', value: '#EEF8F0' },
    ],
  },
  {
    title: '보더',
    colors: [
      { name: '--palette-border-subtle', value: '#DFEEE1' },
      { name: '--palette-border-soft', value: '#E4F0E6' },
      { name: '--palette-border-accent-soft', value: '#CDE9D4' },
      { name: '--palette-border-accent', value: '#7FC98F' },
    ],
  },
  {
    title: '보조 서피스 · 컨트롤',
    colors: [
      { name: '--palette-control-surface', value: '#EAF3EC' },
      { name: '--palette-control-hover', value: '#DCEBDE' },
      { name: '--palette-control-pressed', value: '#D3E2D7' },
      { name: '--palette-control-tint', value: '#E1EFE4' },
      { name: '--palette-control-active', value: '#7BC98C' },
      { name: '--palette-control-disabled', value: '#F2F5F3' },
      { name: '--palette-control-foreground', value: '#2F7A42' },
    ],
  },
  {
    title: '텍스트',
    colors: [
      { name: '--palette-text-primary', value: '#234634' },
      { name: '--palette-text-secondary', value: '#4A6B58' },
      { name: '--palette-text-muted', value: '#86A392' },
      { name: '--palette-text-disabled', value: '#A9BFB2' },
    ],
  },
  {
    title: '포인트 · 순위 · 상태',
    colors: [
      { name: '--palette-point-lime', value: '#DCEC63' },
      { name: '--palette-point-lime-strong', value: '#C2DC44' },
      { name: '--palette-point-foreground', value: '#3C5C22' },
      { name: '--palette-rank-gold', value: '#F7C948' },
      { name: '--palette-rank-silver', value: '#BFCBD4' },
      { name: '--palette-rank-bronze', value: '#E3A063' },
      { name: '--palette-state-orange', value: '#E0844A' },
    ],
  },
  {
    title: '일러스트',
    colors: [
      { name: '--palette-illustration-sky', value: '#E4F3FA' },
      { name: '--palette-illustration-green-light', value: '#C6E6CC' },
      { name: '--palette-illustration-green', value: '#A9D9B4' },
      { name: '--palette-illustration-leaf', value: '#6FA34E' },
      { name: '--palette-illustration-lime', value: '#CBE092' },
    ],
  },
];

function ColorPalette() {
  const total = groups.reduce((count, group) => count + group.colors.length, 0);

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
              {group.colors.map((color) => (
                <article key={color.name} className="flex items-center gap-4 rounded-2xl border bg-surface p-4 shadow-sm">
                  <div
                    className="size-20 shrink-0 rounded-full border shadow-sm"
                    style={{ backgroundColor: `var(${color.name}, ${color.value})` }}
                    aria-label={`${color.value} 색상 미리보기`}
                  />
                  <div className="min-w-0 space-y-1">
                    <p className="break-all text-sm font-medium text-foreground">{color.name}</p>
                    <p className="text-sm text-muted">{color.value}</p>
                  </div>
                </article>
              ))}
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
