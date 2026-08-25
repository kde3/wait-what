import type { Meta, StoryObj } from '@storybook/react';
import { ThemeMenu } from '../../components/home/theme-menu';

const meta = {
  title: 'Home/Theme Menu',
  component: ThemeMenu,
  decorators: [(Story) => <div className="p-6"><Story /></div>],
} satisfies Meta<typeof ThemeMenu>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
