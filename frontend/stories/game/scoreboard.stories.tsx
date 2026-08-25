import type { Meta, StoryObj } from '@storybook/react';
import { Scoreboard } from '../../components/game/scoreboard';
import { roomState } from '../mocks/room-states';

const scoredState = {
  ...roomState,
  players: [
    { nickname: '그림 고양이', isHost: false, team: null, score: 5 },
    { nickname: '익명 방장', isHost: true, team: null, score: 3, you: true },
    { nickname: '초록 로봇', isHost: false, team: null, score: 1 },
  ],
};

const meta = {
  title: 'Game/Scoreboard',
  component: Scoreboard,
  decorators: [(Story) => <div className="mx-auto max-w-xl p-6"><Story /></div>],
  args: { state: scoredState, teamScores: null },
} satisfies Meta<typeof Scoreboard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Individual: Story = {};
export const Teams: Story = { args: { teamScores: [3, 2] } };
export const AllZero: Story = {
  args: { state: { ...scoredState, players: scoredState.players.map((p) => ({ ...p, score: 0 })) } },
};
