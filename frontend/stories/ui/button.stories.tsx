import type { Meta, StoryObj } from '@storybook/react';
import { Button, SoftButton } from '../../components/ui/button';

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

/** 연분홍 바탕 + 진분홍 글자. 주 동작 옆의 보조 동작에 쓴다. */
export const Soft: Story = {
  render: (args) => <SoftButton {...args} />,
};

export const SoftDisabled: Story = {
  args: { isDisabled: true },
  render: (args) => <SoftButton {...args} />,
};

/** 주 버튼과 나란히 놓았을 때 */
export const SoftWithPrimary: Story = {
  render: (args) => (
    <div className="flex gap-2">
      <SoftButton {...args}>돌아가기</SoftButton>
      <Button {...args}>게임 시작</Button>
    </div>
  ),
};
