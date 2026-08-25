import type { Meta, StoryObj } from '@storybook/react';
import { SpeedPlay } from '../../components/game/modes/speed-play';
import { speedDrawState, speedGuessState, speedRevealState } from '../mocks/game-states';

const meta = {
  title: 'Game/Speed Play',
  component: SpeedPlay,
  decorators: [(Story) => <main className="mx-auto max-w-3xl space-y-4 p-6"><Story /></main>],
  args: {
    state: speedDrawState,
    playerId: 'storybook-player',
    api: async () => ({ ok: true }),
    busy: false,
    error: '',
  },
} satisfies Meta<typeof SpeedPlay>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Drawing: Story = {};
export const Guessing: Story = { args: { state: speedGuessState } };
export const Reveal: Story = { args: { state: speedRevealState } };
