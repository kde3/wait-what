import type { Meta, StoryObj } from '@storybook/react';
import { JoinRoomView } from '../../views/join-room-view';

const meta = {
  title: 'Views/Join Room',
  component: JoinRoomView,
  parameters: { layout: 'fullscreen' },
  args: {
    code: 'PLAY',
    nickname: '익명',
    needsPassword: false,
    busy: false,
    error: '',
    onJoin: () => undefined,
  },
} satisfies Meta<typeof JoinRoomView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Public: Story = {};
export const NeedsPassword: Story = { args: { needsPassword: true } };
export const WithError: Story = { args: { needsPassword: true, error: '방 비밀번호가 올바르지 않습니다.' } };
export const Busy: Story = { args: { busy: true } };
