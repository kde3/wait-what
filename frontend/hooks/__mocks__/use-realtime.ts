// 스토리북 전용 대체 구현 — .storybook/preview.tsx의 sb.mock()이 이 파일로 우회시킨다.
// 실제 훅은 HTTP + 웹소켓으로 백엔드를 부르지만, 여기서는 아무것도 하지 않는다.
//
// 이 파일의 내용은 원본 모듈(hooks/use-realtime.ts)의 자리에 끼워지기 때문에
// 상대 경로 import가 __mocks__ 기준이 아니라 hooks/ 기준으로 해석된다.
// 혼란을 피하려고 픽스처는 여기서 가져오지 않고, 스토리에서 mockReturnValue로 넣는다.
import { fn } from 'storybook/test';

export const useHomeRooms = fn(() => ({
  rooms: [],
  live: true,
})).mockName('useHomeRooms');

export const useRoomState = fn(() => ({
  state: null,
  live: true,
  gone: false,
  refresh: async () => {},
})).mockName('useRoomState');
