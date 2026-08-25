import { useEffect } from 'react';
import type { Preview } from '@storybook/react-vite';
import { sb } from 'storybook/test';
import { I18nProvider } from '../components/i18n-provider';
import '../app/globals.css';

// 백엔드를 부르는 훅은 hooks/__mocks__/use-realtime.ts로 우회시킨다.
// 서버가 떠 있지 않아도 스토리가 뜨고, 스토리마다 목록 상태를 지정할 수 있다.
// 경로 해석이 Node의 require.resolve를 타서 확장자를 생략할 수 없다.
sb.mock('../hooks/use-realtime.ts');

export const globalTypes = {
  theme: {
    description: '테마',
    toolbar: {
      title: '테마',
      icon: 'paintbrush',
      items: [
        { value: 'light', title: '라이트', icon: 'sun' },
        { value: 'dark', title: '다크', icon: 'moon' },
      ],
      dynamicTitle: true,
    },
  },
};

export const initialGlobals = { theme: 'light' };

function ThemeFrame({ theme, children }: { theme: string; children: React.ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('light', theme !== 'dark');
    root.setAttribute('data-theme', theme);
  }, [theme]);

  return <div className="min-h-screen bg-background text-foreground">{children}</div>;
}

const preview: Preview = {
  decorators: [
    (Story, context) => (
      <ThemeFrame theme={context.globals.theme ?? 'light'}>
        <I18nProvider>
          <Story />
        </I18nProvider>
      </ThemeFrame>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    a11y: { test: 'todo' },
    controls: { expanded: true },
  },
};

export default preview;
