import type { Meta, StoryObj } from '@storybook/react';
import { GameRulesCarousel } from '../../components/home/game-rules-carousel';

const meta = {
  title: 'Home/Game Rules Carousel',
  component: GameRulesCarousel,
  decorators: [(Story) => <div className="mx-auto w-full max-w-md bg-surface p-6"><Story /></div>],
} satisfies Meta<typeof GameRulesCarousel>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

