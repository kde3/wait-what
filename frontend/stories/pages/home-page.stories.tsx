import type { Meta, StoryObj } from '@storybook/react';
import HomePageView from '../../components/pages/home-page-view';

const meta = {
  title: 'Pages/Home',
  component: HomePageView,
  parameters: { layout: 'fullscreen', nextjs: { appDirectory: true } },
} satisfies Meta<typeof HomePageView>;

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
