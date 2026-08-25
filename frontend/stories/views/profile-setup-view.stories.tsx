import type { Meta, StoryObj } from '@storybook/react';
import { ProfileSetup } from '../../views/profile-setup-view';

const meta = {
  title: 'Views/Profile Setup',
  component: ProfileSetup,
  args: { initialValue: '', isBusy: false, onSubmit: () => undefined },
} satisfies Meta<typeof ProfileSetup>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Empty: Story = {};
export const Filled: Story = { args: { initialValue: '익명 방장' } };
export const Busy: Story = { args: { initialValue: '익명 방장', isBusy: true } };
