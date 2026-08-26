import type { Meta, StoryObj } from '@storybook/react';
import { ImposterPlay } from '../../components/game/modes/imposter-play';
import {
  imposterAsImposterState,
  imposterGuessState,
  imposterGuessWaitState,
  imposterTurnState,
  imposterVoteState,
  imposterVotedState,
} from '../mocks/game-states';

const meta = {
  title: 'Game/Imposter Play',
  component: ImposterPlay,
  decorators: [(Story) => <main className="mx-auto max-w-5xl space-y-4 p-6"><Story /></main>],
  args: {
    state: imposterTurnState,
    playerId: 'storybook-player',
    api: async () => ({ ok: true }),
    busy: false,
    error: '',
  },
} satisfies Meta<typeof ImposterPlay>;

export default meta;
type Story = StoryObj<typeof meta>;
export const YourTurnAsCrew: Story = {};
export const AsImposter: Story = { args: { state: imposterAsImposterState } };
export const VotePhase: Story = { args: { state: imposterVoteState } };
export const VotePhaseVoted: Story = { args: { state: imposterVotedState } };
export const GuessPhaseAsImposter: Story = { args: { state: imposterGuessState } };
export const GuessPhaseAsCrew: Story = { args: { state: imposterGuessWaitState } };
