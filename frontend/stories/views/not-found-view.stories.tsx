import type { Meta, StoryObj } from '@storybook/react';
import { NotFoundView } from '../../views/not-found-view';

const meta = {
  title: 'Views/Not Found',
  component: NotFoundView,
  parameters: { layout: 'fullscreen', nextjs: { appDirectory: true } },
} satisfies Meta<typeof NotFoundView>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
