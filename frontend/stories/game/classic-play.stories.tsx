import type { Meta, StoryObj } from '@storybook/react';
import { ClassicPlay } from '../../components/game/modes/classic-play';
import {
  classicDrawingState,
  classicFollowingPhraseState,
  classicGeneratedDrawingState,
  classicPhraseState,
} from '../mocks/room-states';
import { classicSubmittedDrawingState, classicSubmittedPhraseState } from '../mocks/game-states';

const meta = {
  title: 'Game/Classic Play',
  component: ClassicPlay,
  decorators: [(Story) => <main className="mx-auto max-w-3xl space-y-4 p-6"><Story /></main>],
  args: {
    state: classicPhraseState,
    playerId: 'storybook-player',
    api: async () => ({ ok: true }),
    busy: false,
    error: '',
  },
} satisfies Meta<typeof ClassicPlay>;

export default meta;
type Story = StoryObj<typeof meta>;
export const FirstPhrase: Story = {};
export const PhraseSubmitted: Story = { args: { state: classicSubmittedPhraseState } };
export const Drawing: Story = { args: { state: classicDrawingState } };
export const GeneratedDrawing: Story = { args: { state: classicGeneratedDrawingState } };
export const DrawingSubmitted: Story = { args: { state: classicSubmittedDrawingState } };
export const FollowingPhrase: Story = { args: { state: classicFollowingPhraseState } };
