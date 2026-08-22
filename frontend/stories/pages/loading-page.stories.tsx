import type { Meta, StoryObj } from '@storybook/react';
import { LoadingPageView } from '../../components/pages/loading-page-view';

const meta = {
  title: 'Pages/Loading',
  component: LoadingPageView,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof LoadingPageView>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
