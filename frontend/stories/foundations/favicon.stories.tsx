import type { Meta, StoryObj } from '@storybook/react';

const SIZES = [16, 32, 48, 64];

function FaviconShowcase() {
  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-8">
      <div className="mx-auto w-full max-w-3xl space-y-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">파비콘</h1>
          <p className="text-sm text-muted">frontend/public/favicon.ico</p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">크기별 미리보기</h2>
          <div className="flex flex-wrap items-end gap-6 rounded-2xl border bg-surface p-6 shadow-sm">
            {SIZES.map((size) => (
              <figure key={size} className="space-y-2 text-center">
                <img src="/favicon.ico" alt={`favicon ${size}px`} width={size} height={size} className="mx-auto" style={{ imageRendering: 'pixelated' }} />
                <figcaption className="text-xs text-muted">{size}px</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">브라우저 탭</h2>
          <div className="rounded-2xl border bg-surface p-6 shadow-sm">
            <div className="inline-flex max-w-full items-center gap-2 rounded-t-lg border border-b-0 bg-surface-secondary px-4 py-2">
              <img src="/favicon.ico" alt="favicon" width={16} height={16} />
              <span className="truncate text-sm">wait, what?</span>
              <span className="text-muted">×</span>
            </div>
            <div className="rounded-b-lg rounded-tr-lg border bg-background p-6 text-sm text-muted">
              AI 그림으로 즐기는 파티 게임
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

const meta = {
  title: 'Foundations/Favicon',
  component: FaviconShowcase,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof FaviconShowcase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Favicon: Story = {};
