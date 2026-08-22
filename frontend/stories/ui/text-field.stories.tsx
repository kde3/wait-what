import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '../../components/ui/input';
import { TextField } from '../../components/ui/text-field';

const meta = {
  title: 'UI/Text Field',
  component: TextField,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <main className="min-h-screen w-full px-4 py-12">
        <Story />
      </main>
    ),
  ],
  args: {
    label: '닉네임',
    children: <Input placeholder="닉네임을 입력하세요" />,
  },
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithDescription: Story = {
  args: {
    description: '최대 12자까지 입력할 수 있어요.',
  },
};

export const Invalid: Story = {
  args: {
    errorMessage: '닉네임을 입력하세요.',
  },
};
