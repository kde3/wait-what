import type { Meta, StoryObj } from '@storybook/react';
import { SpeedTeamPlay } from '../../components/game/modes/speed-team-play';
import { speedTeamPlayState } from '../mocks/game-states';

const meta = {
  title: 'Game/Speed Team Play',
  component: SpeedTeamPlay,
  decorators: [(Story) => <main className="mx-auto max-w-3xl space-y-4 p-6"><Story /></main>],
  args: {
    state: speedTeamPlayState,
    playerId: 'storybook-player',
    api: async () => ({ ok: true }),
    busy: false,
    error: '',
  },
} satisfies Meta<typeof SpeedTeamPlay>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playing: Story = {};
