import type { Meta, StoryObj } from '@storybook/react';
import { ParticipantList } from '../../components/lobby/participant-list';
import { lobbyState, teamLobbyState } from '../mocks/room-states';

const meta = {
  title: 'Lobby/Participant List',
  component: ParticipantList,
  args: { busy: false, onJoinTeam: () => undefined },
  decorators: [(Story) => <div className="max-w-xs p-6"><Story /></div>],
} satisfies Meta<typeof ParticipantList>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { args: { state: lobbyState } };
export const Teams: Story = { args: { state: teamLobbyState } };
