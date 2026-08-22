import './globals.css';
import { I18nProvider } from '../components/i18n-provider';

export const metadata = {
  title: 'AI 갈틱폰',
  description: 'AI 그림으로 즐기는 파티 게임 — 릴레이, 스피드 퀴즈, 임포스터까지',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}


