import type { Meta, StoryObj } from '@storybook/react';
import Room from '../../components/room/room';
import { roomState, teamRoomState } from '../mocks/room-states';

const meta = {
  title: 'Room/Room',
  component: Room,
  decorators: [(Story) => <main className="mx-auto max-w-5xl space-y-4 p-6"><Story /></main>],
  args: {
    state: roomState,
    playerId: 'storybook-player',
    api: async () => ({ ok: true }),
    busy: false,
    error: '',
    onStarted: () => undefined,
  },
} satisfies Meta<typeof Room>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Lobby: Story = {};
export const TeamLobby: Story = { args: { state: teamRoomState } };
