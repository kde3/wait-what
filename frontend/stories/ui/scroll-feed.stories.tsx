import type { Meta, StoryObj } from '@storybook/react';
import { ScrollFeed } from '../../components/ui/scroll-feed';

const rows = (count: number) =>
  Array.from({ length: count }, (_, i) => (
    <div key={i} className="text-sm">
      {i + 1}번째 줄 — 내용이 넘치면 항상 맨 아래로 스크롤됩니다
    </div>
  ));

const meta = {
  title: 'UI/Scroll Feed',
  component: ScrollFeed,
  decorators: [(Story) => <main className="mx-auto max-w-lg p-6"><Story /></main>],
  args: { bottomKey: 3, children: rows(3) },
} satisfies Meta<typeof ScrollFeed>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Short: Story = {};
export const Overflowing: Story = { args: { bottomKey: 20, children: rows(20) } };
export const Empty: Story = { args: { bottomKey: 0, children: null } };
