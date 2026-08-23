import type { Meta, StoryObj } from '@storybook/react';
import HomeView from '../../views/home-view';

const meta = {
  title: 'Views/Home',
  component: HomeView,
  parameters: { layout: 'fullscreen', nextjs: { appDirectory: true } },
} satisfies Meta<typeof HomeView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ProfileSetup: Story = {
  loaders: [async () => {
    window.sessionStorage.removeItem('gp_nickname');
    return {};
  }],
};

export const Main: Story = {
  loaders: [async () => {
    window.sessionStorage.setItem('gp_nickname', '익명');
    return {};
  }],
};
