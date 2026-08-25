import type { Meta, StoryObj } from '@storybook/react';
import { TeamBadge } from '../../components/game/team-badge';

const meta = {
  title: 'Game/Team Badge',
  component: TeamBadge,
  decorators: [(Story) => <div className="flex gap-2 p-6"><Story /></div>],
  args: { team: 0 },
} satisfies Meta<typeof TeamBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TeamA: Story = {};
export const TeamB: Story = { args: { team: 1 } };

// 팀이 없으면 아무것도 그리지 않는다
export const NoTeam: Story = { args: { team: null } };

export const Both: Story = {
  render: () => (
    <>
      <TeamBadge team={0} />
      <TeamBadge team={1} />
    </>
  ),
};
