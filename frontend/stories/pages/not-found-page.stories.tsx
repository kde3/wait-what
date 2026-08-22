import type { Meta, StoryObj } from '@storybook/react';
import { NotFoundPageView } from '../../components/pages/not-found-page-view';

const meta = {
  title: 'Pages/Not Found',
  component: NotFoundPageView,
  parameters: { layout: 'fullscreen', nextjs: { appDirectory: true } },
} satisfies Meta<typeof NotFoundPageView>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
