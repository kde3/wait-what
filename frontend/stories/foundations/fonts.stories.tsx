import type { Meta, StoryObj } from '@storybook/react';

interface FontFace {
  family: string;
  token: string;
  file: string;
  weights: { label: string; weight: number }[];
  usage: string;
}

const FACES: FontFace[] = [
  {
    family: 'Mona',
    token: '--font-brand',
    file: '/fonts/Mona/Mona12.woff2 · /fonts/Mona/Mona12-Bold.woff2',
    weights: [
      { label: 'Regular 400', weight: 400 },
      { label: 'Bold 700', weight: 700 },
      { label: 'ExtraBold 800', weight: 800 },
    ],
    usage: '기본 UI · 제목 · 버튼 · 라벨 (--font-heading, --font-sans)',
  },
  {
    family: 'Pretendard',
    token: '--font-pretendard',
    file: '/fonts/Pretendard/PretendardVariable.woff2 (가변 100~900)',
    weights: [
      { label: 'Light 300', weight: 300 },
      { label: 'Regular 400', weight: 400 },
      { label: 'SemiBold 600', weight: 600 },
      { label: 'Bold 700', weight: 700 },
    ],
    usage: '설명문 · 보조 문구 (.text-muted, .font-description)',
  },
];

const SAMPLE = '우주복을 입은 고양이가 라면을 먹는 모습 — wait, what? 1234567890';

function FontShowcase() {
  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">폰트</h1>
          <p className="text-sm text-muted">frontend/public/fonts · @font-face 정의는 app/globals.css</p>
        </header>

        {FACES.map((face) => (
          <section key={face.family} className="space-y-4 rounded-2xl border bg-surface p-6 shadow-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl font-semibold">{face.family}</h2>
              <code className="text-xs text-muted">{face.token}</code>
            </div>
            <p className="text-sm text-muted">{face.usage}</p>
            <p className="text-xs text-muted">{face.file}</p>
            <div className="space-y-3">
              {face.weights.map(({ label, weight }) => (
                <div key={weight} className="space-y-1 border-b pb-3 last:border-0">
                  <p className="text-xs text-muted">{label}</p>
                  <p className="break-words text-2xl" style={{ fontFamily: `var(${face.token})`, fontWeight: weight }}>
                    {SAMPLE}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

const meta = {
  title: 'Foundations/Fonts',
  component: FontShowcase,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof FontShowcase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Fonts: Story = {};
