import type { Meta, StoryObj } from '@storybook/react';
import { ImposterVotePanel } from '../../components/game/imposter-vote-panel';

const candidates = [
  { nickname: '익명 방장', you: true, left: false },
  { nickname: '그림 고양이', you: false, left: false },
  { nickname: '초록 로봇', you: false, left: false },
];

const meta = {
  title: 'Game/Imposter Vote Panel',
  component: ImposterVotePanel,
  decorators: [(Story) => <main className="mx-auto max-w-3xl p-6"><Story /></main>],
  args: {
    candidates,
    yourVote: null,
    votedCount: 1,
    voterTotal: 3,
    busy: false,
    onVote: () => {},
  },
} satisfies Meta<typeof ImposterVotePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Picking: Story = {};

export const Voted: Story = { args: { yourVote: 2, votedCount: 2 } };

export const WithLeaver: Story = {
  args: {
    candidates: [
      { nickname: '익명 방장', you: true, left: false },
      { nickname: '그림 고양이', you: false, left: true },
      { nickname: '초록 로봇', you: false, left: false },
    ],
  },
};

export const Busy: Story = { args: { busy: true } };
