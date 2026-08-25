import type { Meta, StoryObj } from '@storybook/react';
import { SubmittedNotice } from '../../components/game/submitted-notice';

const meta = {
  title: 'Game/Submitted Notice',
  component: SubmittedNotice,
  decorators: [(Story) => <div className="mx-auto max-w-xl p-6"><Story /></div>],
} satisfies Meta<typeof SubmittedNotice>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
