import type { Meta, StoryObj } from '@storybook/react';
import { sfx } from '../../lib/sound';
import { Button } from '../../components/ui/button';

const BGM_FILES = [
  { name: 'home.mp3', path: '/sounds/bgm/home.mp3', description: '홈 화면 · 로비 배경음악' },
  { name: 'play.mp3', path: '/sounds/bgm/play.mp3', description: '게임 진행 중 배경음악' },
];

const SFX_FILES = [
  { name: 'button.mp3', path: '/sounds/sfx/button.mp3', description: '버튼 효과음 파일' },
  { name: 'game-over.mp3', path: '/sounds/sfx/game-over.mp3', description: '게임 종료 효과음 파일' },
];

const SYNTH_SFX = [
  { name: 'click', description: '버튼 클릭' },
  { name: 'pop', description: '복사·입장 등 가벼운 확인' },
  { name: 'submit', description: '제출 완료' },
  { name: 'correct', description: '정답' },
  { name: 'wrong', description: '오답' },
  { name: 'tick', description: '카운트다운 5초 이하' },
  { name: 'start', description: '게임·라운드 시작' },
  { name: 'win', description: '게임 종료 팡파레' },
] as const;

function SoundShowcase() {
  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-8">
      <div className="mx-auto w-full max-w-4xl space-y-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">사운드</h1>
          <p className="text-sm text-muted">
            frontend/public/sounds · 효과음은 lib/sound.ts가 WebAudio로 런타임 합성하고, BGM만 파일을 재생한다
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">배경음악 (파일)</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {BGM_FILES.map((file) => (
              <div key={file.path} className="space-y-2 rounded-2xl border bg-surface p-4 shadow-sm">
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted">{file.description}</p>
                <audio controls preload="none" src={file.path} className="w-full" />
                <p className="break-all text-xs text-muted">{file.path}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">효과음 파일</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {SFX_FILES.map((file) => (
              <div key={file.path} className="space-y-2 rounded-2xl border bg-surface p-4 shadow-sm">
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted">{file.description}</p>
                <audio controls preload="none" src={file.path} className="w-full" />
                <p className="break-all text-xs text-muted">{file.path}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">합성 효과음 (lib/sound.ts sfx.*)</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {SYNTH_SFX.map((item) => (
              <div key={item.name} className="space-y-2 rounded-2xl border bg-surface p-4 text-center shadow-sm">
                <Button className="w-full" onClick={() => sfx[item.name]()}>
                  sfx.{item.name}()
                </Button>
                <p className="text-xs text-muted">{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

const meta = {
  title: 'Foundations/Sounds',
  component: SoundShowcase,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof SoundShowcase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Sounds: Story = {};
