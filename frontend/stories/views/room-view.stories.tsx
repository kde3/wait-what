import type { Meta, StoryObj } from '@storybook/react';
import { RoomView } from '../../views/room-view';
import { classicPhraseState, classicResultState, roomState, teamRoomState } from '../mocks/room-states';

const meta = {
  title: 'Views/Room',
  component: RoomView,
  parameters: { layout: 'fullscreen', nextjs: { appDirectory: true } },
  args: {
    playerId: 'storybook-player',
    api: async () => ({ ok: true }),
    busy: false,
    error: '',
    live: true,
    onBack: () => undefined,
    onStarted: () => undefined,
  },
} satisfies Meta<typeof RoomView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Room: Story = { args: { state: roomState } };
export const TeamRoom: Story = { args: { state: teamRoomState } };
export const Reconnecting: Story = { args: { state: roomState, live: false } };
export const FirstPhrase: Story = { args: { state: classicPhraseState } };
export const FinalResult: Story = { args: { state: classicResultState } };
