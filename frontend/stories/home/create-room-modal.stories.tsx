import type { Meta, StoryObj } from '@storybook/react';
import { CreateRoomModal } from '../../components/home/create-room-modal';

const meta = {
  title: 'Home/Create Room Modal',
  component: CreateRoomModal,
  parameters: { layout: 'fullscreen' },
  args: {
    isOpen: true,
    onOpenChange: () => undefined,
    suggestedName: 'AI 그림 전화방',
    busy: false,
    error: '',
    onCreate: () => undefined,
  },
} satisfies Meta<typeof CreateRoomModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Busy: Story = { args: { busy: true } };
export const WithError: Story = { args: { error: '요청에 실패했습니다.' } };
