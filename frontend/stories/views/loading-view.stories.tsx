import type { Meta, StoryObj } from '@storybook/react';
import { LoadingView } from '../../views/loading-view';

const meta = {
  title: 'Views/Loading',
  component: LoadingView,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof LoadingView>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
