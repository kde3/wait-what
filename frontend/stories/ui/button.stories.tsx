import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../../components/ui/button';

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <main className="grid min-h-[280px] w-[min(92vw,620px)] place-items-center p-10">
        <Story />
      </main>
    ),
  ],
  args: {
    children: '게임 시작',
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
};

export const Disabled: Story = {
  args: {
    isDisabled: true,
    children: '게임 시작',
  },
};
