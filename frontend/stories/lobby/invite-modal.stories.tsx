import type { Meta, StoryObj } from '@storybook/react';
import { InviteModal } from '../../components/lobby/invite-modal';

const meta = {
  title: 'Lobby/Invite Modal',
  component: InviteModal,
  parameters: { layout: 'fullscreen' },
  args: {
    code: 'PLAY',
    url: 'http://localhost:3000/room/PLAY',
    isOpen: true,
    copied: false,
    onOpenChange: () => undefined,
    onCopy: () => undefined,
  },
} satisfies Meta<typeof InviteModal>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Copied: Story = { args: { copied: true } };
