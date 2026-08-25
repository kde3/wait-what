import type { Meta, StoryObj } from '@storybook/react';
import GameResults from '../../components/game/game-results';
import { classicResultState } from '../mocks/room-states';
import {
  coopResultState,
  imposterResultState,
  speedResultState,
  speedTeamResultState,
} from '../mocks/game-states';

const meta = {
  title: 'Game/Game Results',
  component: GameResults,
  decorators: [(Story) => <main className="mx-auto max-w-3xl space-y-4 p-6"><Story /></main>],
  args: {
    state: classicResultState,
    playerId: 'storybook-player',
    api: async () => ({ ok: true }),
    busy: false,
    onLeave: () => undefined,
  },
} satisfies Meta<typeof GameResults>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Classic: Story = {};
export const Speed: Story = { args: { state: speedResultState } };
export const SpeedTeam: Story = { args: { state: speedTeamResultState } };
export const Coop: Story = { args: { state: coopResultState } };
export const Imposter: Story = { args: { state: imposterResultState } };
