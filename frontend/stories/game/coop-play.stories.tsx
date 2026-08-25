import type { Meta, StoryObj } from '@storybook/react';
import { CoopPlay } from '../../components/game/modes/coop-play';
import { coopPlayState, coopSubmittedState } from '../mocks/game-states';

const meta = {
  title: 'Game/Coop Play',
  component: CoopPlay,
  decorators: [(Story) => <main className="mx-auto max-w-3xl space-y-4 p-6"><Story /></main>],
  args: {
    state: coopPlayState,
    playerId: 'storybook-player',
    api: async () => ({ ok: true }),
    busy: false,
    error: '',
  },
} satisfies Meta<typeof CoopPlay>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Drawing: Story = {};
export const Submitted: Story = { args: { state: coopSubmittedState } };
