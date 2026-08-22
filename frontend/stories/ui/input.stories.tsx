import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '../../components/ui/input';

const meta = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <main className="min-h-[360px] w-[min(92vw,560px)] p-10">
        <Story />
      </main>
    ),
  ],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    'aria-label': '닉네임',
    placeholder: '닉네임을 입력하세요',
  },
};

export const Filled: Story = {
  args: {
    'aria-label': '초대 코드',
    defaultValue: 'PLAY',
  },
};

export const Disabled: Story = {
  args: {
    'aria-label': '비활성 입력',
    disabled: true,
    placeholder: '입력할 수 없습니다',
  },
};
