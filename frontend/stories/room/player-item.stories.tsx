import type { Meta, StoryObj } from '@storybook/react';
import { PlayerItem } from '../../components/room/player-item';

const meta = {
  title: 'Room/Player Item',
  component: PlayerItem,
  decorators: [(Story) => <ul className="max-w-xs list-none p-6"><Story /></ul>],
  args: { player: { nickname: '그림 고양이', isHost: false, team: null, score: 0 } },
} satisfies Meta<typeof PlayerItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Host: Story = {
  args: { player: { nickname: '익명 방장', isHost: true, team: null, score: 0 } },
};

export const You: Story = {
  args: { player: { nickname: '익명 방장', isHost: true, team: null, score: 0, you: true } },
};

export const LongNickname: Story = {
  args: { player: { nickname: '엄청나게길고긴닉네임', isHost: false, team: null, score: 0 } },
};
