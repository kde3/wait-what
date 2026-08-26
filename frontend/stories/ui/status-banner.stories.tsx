import type { Meta, StoryObj } from '@storybook/react';
import { StatusBanner } from '../../components/ui/status-banner';
import { Button } from '../../components/ui/button';

const meta = {
  title: 'UI/Status Banner',
  component: StatusBanner,
  decorators: [(Story) => <div className="mx-auto max-w-xl p-6"><Story /></div>],
  args: { children: '연결 중이에요…' },
} satisfies Meta<typeof StatusBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithEmphasis: Story = {
  render: () => (
    <StatusBanner>
      <span>
        <b className="text-foreground">제출 완료!</b> 다른 참가자를 기다리는 중...
      </span>
    </StatusBanner>
  ),
};

export const WithAction: Story = {
  render: () => (
    <StatusBanner className="gap-3">
      <span>다른 참가자를 기다리는 중... (1/3)</span>
      <Button variant="outline" className="h-7 w-auto px-2 text-xs">
        나가기
      </Button>
    </StatusBanner>
  ),
};
