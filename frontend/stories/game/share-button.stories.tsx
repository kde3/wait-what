import type { Meta, StoryObj } from '@storybook/react';
import { ShareButton } from '../../components/game/share-button';
import { classicResultState } from '../mocks/room-states';
import { coopResultState, imposterResultState, speedResultState } from '../mocks/game-states';

const meta = {
  title: 'Game/Share Button',
  component: ShareButton,
  decorators: [(Story) => <div className="mx-auto max-w-xl p-6"><Story /></div>],
  args: { results: classicResultState.results },
} satisfies Meta<typeof ShareButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Classic: Story = {};
export const Speed: Story = { args: { results: speedResultState.results } };
export const Coop: Story = { args: { results: coopResultState.results } };
export const Imposter: Story = { args: { results: imposterResultState.results } };
