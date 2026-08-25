import type { Meta, StoryObj } from '@storybook/react';
import { PromptPanel } from '../../components/game/prompt-panel';

const meta = {
  title: 'Game/Prompt Panel',
  component: PromptPanel,
  decorators: [(Story) => <div className="mx-auto max-w-xl p-6"><Story /></div>],
  args: {
    prompt: '',
    setPrompt: () => undefined,
    imageUrl: null,
    generating: false,
    busy: false,
    locked: false,
    onGenerate: () => undefined,
    onCancelGenerate: () => undefined,
    onSubmit: () => undefined,
    onUnsubmit: () => undefined,
  },
} satisfies Meta<typeof PromptPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const Typing: Story = { args: { prompt: '우주복을 입은 고양이가 라면을 먹는 모습' } };
export const Generating: Story = { args: { prompt: '우주복을 입은 고양이', generating: true } };

// 이미지가 있어야 제출 버튼이 나온다
export const ReadyToSubmit: Story = {
  args: { prompt: '우주복을 입은 고양이', imageUrl: '/images/mock-image.png' },
};

// 제출 후 — 입력이 잠기고 제출 버튼이 수정 버튼으로 바뀐다
export const Locked: Story = {
  args: { prompt: '우주복을 입은 고양이', imageUrl: '/images/mock-image.png', locked: true },
};
