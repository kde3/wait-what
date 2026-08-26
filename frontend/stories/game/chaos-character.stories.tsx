import type { Meta, StoryObj } from '@storybook/react';
import { ChaosCharacter } from '../../components/game/chaos-character';
import { CHAOS_CHARACTERS } from '../../lib/chaos';

const meta = {
  title: 'Game/Chaos Character',
  component: ChaosCharacter,
  decorators: [(Story) => <main className="grid min-h-screen place-items-center p-8"><Story /></main>],
  args: { character: '404', size: 'large', state: 'idle' },
  argTypes: {
    character: { control: 'select', options: CHAOS_CHARACTERS.map((character) => character.id) },
    size: { control: 'select', options: ['small', 'medium', 'large'] },
    state: { control: 'select', options: ['idle', 'confused', 'happy', 'shocked', 'thinking', 'active', 'success', 'failure'] },
  },
} satisfies Meta<typeof ChaosCharacter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Error404: Story = { args: { character: '404' } };
export const Glitch: Story = { args: { character: 'glitch' } };
export const Pixel: Story = { args: { character: 'pixel' } };
export const Filter: Story = { args: { character: 'filter' } };
export const Retry: Story = { args: { character: 'retry' } };
export const Timeout: Story = { args: { character: 'timeout' } };
export const Null: Story = { args: { character: 'null' } };
export const SmallActive: Story = { args: { character: 'glitch', size: 'small', state: 'active' } };
export const MediumThinking: Story = { args: { character: 'pixel', size: 'medium', state: 'thinking' } };
