import type { Meta, StoryObj } from '@storybook/react';
import Header from '../../components/layout/header';

const meta = {
  title: 'Layout/Header',
  component: Header,
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Bare: Story = {};
export const WithNickname: Story = { args: { nickname: '익명 방장', onBackToProfile: () => undefined } };
export const WithBack: Story = { args: { nickname: '익명 방장', onBack: () => undefined } };
