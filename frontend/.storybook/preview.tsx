import type { Preview } from '@storybook/react-vite';
import { sb } from 'storybook/test';
import { I18nProvider } from '../components/i18n-provider';
import '../app/globals.css';

// 백엔드를 부르는 훅은 hooks/__mocks__/use-realtime.ts로 우회시킨다.
// 서버가 떠 있지 않아도 스토리가 뜨고, 스토리마다 목록 상태를 지정할 수 있다.
// 경로 해석이 Node의 require.resolve를 타서 확장자를 생략할 수 없다.
sb.mock('../hooks/use-realtime.ts');

const preview: Preview = {
  decorators: [
    (Story) => (
      <I18nProvider>
        <Story />
      </I18nProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    a11y: { test: 'todo' },
    controls: { expanded: true },
    backgrounds: { default: 'app' },
  },
};

export default preview;
