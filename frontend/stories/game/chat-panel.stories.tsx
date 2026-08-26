import type { Meta, StoryObj } from '@storybook/react';
import { ChatPanel } from '../../components/game/chat-panel';

const messages = [
  { nickname: '익명 방장', text: '초록 로봇 그림이 좀 애매하지 않았어?', you: true },
  { nickname: '그림 고양이', text: '나도 그렇게 봤어', you: false },
  { nickname: '초록 로봇', text: '야 나 억울해', you: false },
];

const meta = {
  title: 'Game/Chat Panel',
  component: ChatPanel,
  decorators: [(Story) => <main className="mx-auto max-w-3xl p-6"><Story /></main>],
  args: { messages, busy: false, onSend: () => {} },
} satisfies Meta<typeof ChatPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithMessages: Story = {};
export const Empty: Story = { args: { messages: [] } };
export const Busy: Story = { args: { busy: true } };
export const Narrow: Story = {
  decorators: [(Story) => <div className="w-64"><Story /></div>],
};
export const LongThread: Story = {
  args: {
    messages: Array.from({ length: 12 }, (_, i) => ({
      nickname: i % 2 ? '그림 고양이' : '익명 방장',
      text: `${i + 1}번째 메시지 — 스크롤이 맨 아래에 붙는지 확인용`,
      you: i % 2 === 0,
    })),
  },
};
