import type { Meta, StoryObj } from '@storybook/react';
import { ChaosReveal } from '../../components/game/chaos-reveal';
import { CHAOS_CHARACTERS } from '../../lib/chaos';

const meta = {
  title: 'Game/Chaos Reveal',
  component: ChaosReveal,
  decorators: [(Story) => <main className="mx-auto max-w-3xl p-6"><Story /></main>],
  args: { character: '404' },
  argTypes: { character: { control: 'select', options: CHAOS_CHARACTERS.map((character) => character.id) } },
} satisfies Meta<typeof ChaosReveal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Null: Story = { args: { character: 'null' } };
