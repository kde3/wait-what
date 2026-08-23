import type { Meta, StoryObj } from '@storybook/react';
import { TimerBar } from '../../components/game/timer-bar';

const meta = {
  title: 'UI/TimerBar',
  component: TimerBar,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <main className="w-[min(92vw,480px)] p-10">
        <Story />
      </main>
    ),
  ],
  args: {
    total: 60,
    remaining: 45,
  },
} satisfies Meta<typeof TimerBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 게이지는 브랜드 옥색. */
export const Default: Story = {};

export const Half: Story = {
  args: { remaining: 30 },
};

/** 10초 이하부터 남은 시간 숫자가 danger 색으로 바뀐다. */
export const Warning: Story = {
  args: { remaining: 8 },
};

export const TimeUp: Story = {
  args: { remaining: 0 },
};
