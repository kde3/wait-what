import type { Meta, StoryObj } from '@storybook/react';
import { RoomView } from '../../views/room-view';
import { classicPhraseState, classicResultState, roomState, teamRoomState } from '../mocks/room-states';
import {
  coopPlayState,
  coopResultState,
  imposterEscapedResultState,
  imposterGuessState,
  imposterResultState,
  imposterTurnState,
  imposterVoteState,
  speedGuessState,
  speedResultState,
  speedTeamPlayState,
  speedTeamResultState,
} from '../mocks/game-states';

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
    onLeave: () => undefined,
    onStarted: () => undefined,
  },
} satisfies Meta<typeof RoomView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Lobby: Story = { args: { state: roomState } };
export const TeamLobby: Story = { args: { state: teamRoomState } };
export const Reconnecting: Story = { args: { state: roomState, live: false } };

export const PlayingClassic: Story = { args: { state: classicPhraseState } };
export const PlayingSpeed: Story = { args: { state: speedGuessState } };
export const PlayingSpeedTeam: Story = { args: { state: speedTeamPlayState } };
export const PlayingCoop: Story = { args: { state: coopPlayState } };
export const PlayingImposter: Story = { args: { state: imposterTurnState } };
export const PlayingImposterVote: Story = { args: { state: imposterVoteState } };
export const PlayingImposterGuess: Story = { args: { state: imposterGuessState } };

export const ResultClassic: Story = { args: { state: classicResultState } };
export const ResultSpeed: Story = { args: { state: speedResultState } };
export const ResultSpeedTeam: Story = { args: { state: speedTeamResultState } };
export const ResultCoop: Story = { args: { state: coopResultState } };
export const ResultImposter: Story = { args: { state: imposterResultState } };
export const ResultImposterEscaped: Story = { args: { state: imposterEscapedResultState } };
