import type { Meta, StoryObj } from '@storybook/react';
import { ExitModal } from '../../components/room/exit-modal';

const meta = {
  title: 'Room/Exit Modal',
  component: ExitModal,
  args: { isOpen: true, reason: 'gone' as const, onGoHome: () => undefined },
} satisfies Meta<typeof ExitModal>;

export default meta;
type Story = StoryObj<typeof meta>;
export const RoomGone: Story = {};
export const Disconnected: Story = { args: { reason: 'disconnected' } };
export const Dropped: Story = { args: { reason: 'dropped' } };
