import type { Meta, StoryObj } from '@storybook/react';
import { mocked } from 'storybook/test';
import HomeView from '../../views/home-view';
// preview.tsx의 sb.mock() 덕분에 이 import는 hooks/__mocks__/use-realtime.ts로 우회된다.
import { useHomeRooms } from '../../hooks/use-realtime';
import { emptyHomeRooms, homeRooms } from '../mocks/room-states';

const setNickname = (nickname: string | null) => {
  if (nickname === null) window.sessionStorage.removeItem('ww_nickname');
  else window.sessionStorage.setItem('ww_nickname', nickname);
};

const setRooms = (rooms: typeof homeRooms) => {
  mocked(useHomeRooms).mockReturnValue({ rooms, live: true });
};

const meta = {
  title: 'Views/Home',
  component: HomeView,
  parameters: { layout: 'fullscreen', nextjs: { appDirectory: true } },
  beforeEach: () => {
    setNickname('익명');
    setRooms(homeRooms);
  },
} satisfies Meta<typeof HomeView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ProfileSetup: Story = {
  beforeEach: () => setNickname(null),
};

export const Main: Story = {};

// 공개방이 하나도 없을 때의 빈 상태
export const Empty: Story = {
  beforeEach: () => setRooms(emptyHomeRooms),
};
