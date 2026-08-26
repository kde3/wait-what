import type { Meta, StoryObj } from '@storybook/react';
import { ChaosPlay } from '../../components/game/modes/chaos-play';
import { chaosPlayState, chaosRevealState } from '../mocks/game-states';

const meta = {
  title: 'Game/Chaos Play',
  component: ChaosPlay,
  decorators: [(Story) => <main className="mx-auto max-w-3xl space-y-4 p-6"><Story /></main>],
  args: {
    state: chaosPlayState,
    playerId: 'storybook-player',
    api: async () => ({ ok: true }),
    busy: false,
    error: '',
  },
} satisfies Meta<typeof ChaosPlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playing: Story = {};
export const Reveal: Story = { args: { state: chaosRevealState } };
