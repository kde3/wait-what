import type { Meta, StoryObj } from '@storybook/react';

interface ImageGroup {
  title: string;
  description: string;
  checker?: boolean;
  images: { name: string; path: string }[];
}

const GROUPS: ImageGroup[] = [
  {
    title: '로고',
    description: '서비스명을 담은 워드마크. 홈·프로필 화면에서 사용.',
    checker: true,
    images: [{ name: 'logo.png', path: '/images/logo.png' }],
  },
  {
    title: '목업 이미지',
    description: 'AI 키가 없을 때와 스토리북 목업에서 쓰는 대체 그림.',
    images: [{ name: 'mock-image.png', path: '/images/mock-image.png' }],
  },
  {
    title: '프로필 캐릭터 (과일 8종)',
    description: 'ProfileAvatar가 무작위로 골라 쓰는 익명 프로필 이미지.',
    images: [
      { name: 'blueberry.png', path: '/images/characters/blueberry.png' },
      { name: 'cherry.png', path: '/images/characters/cherry.png' },
      { name: 'grape.png', path: '/images/characters/grape.png' },
      { name: 'green-apple.png', path: '/images/characters/green-apple.png' },
      { name: 'peach.png', path: '/images/characters/peach.png' },
      { name: 'pineapple.png', path: '/images/characters/pineapple.png' },
      { name: 'strawberry.png', path: '/images/characters/strawberry.png' },
      { name: 'tangerine.png', path: '/images/characters/tangerine.png' },
    ],
  },
  {
    title: '일러스트',
    description: '장식용 일러스트.',
    images: [{ name: 'pink-robot-pencil.png', path: '/images/illustration/pink-robot-pencil.png' }],
  },
];

const CHECKER =
  'repeating-conic-gradient(color-mix(in srgb, var(--palette-text-muted) 18%, transparent) 0% 25%, transparent 0% 50%) 0 0 / 20px 20px';

function ImageShowcase() {
  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">이미지</h1>
          <p className="text-sm text-muted">frontend/public/images</p>
        </header>

        {GROUPS.map((group) => (
          <section key={group.title} className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">{group.title}</h2>
              <p className="text-sm text-muted">{group.description}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {group.images.map((image) => (
                <figure key={image.path} className="space-y-2 rounded-2xl border bg-surface p-4 shadow-sm">
                  <div
                    className="grid aspect-square place-items-center overflow-hidden rounded-lg border"
                    style={group.checker ? { background: CHECKER } : undefined}
                  >
                    <img src={image.path} alt={image.name} className="max-h-full max-w-full object-contain" />
                  </div>
                  <figcaption className="space-y-0.5">
                    <p className="text-sm font-medium">{image.name}</p>
                    <p className="break-all text-xs text-muted">{image.path}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

const meta = {
  title: 'Foundations/Images',
  component: ImageShowcase,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ImageShowcase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Images: Story = {};
