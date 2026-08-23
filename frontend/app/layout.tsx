import './globals.css';
import { I18nProvider } from '../components/i18n-provider';

export const metadata = {
  title: 'wait, what?',
  description: 'AI 그림으로 즐기는 파티 게임',
};

const applyThemeBeforePaint = `(function(){try{var t=localStorage.getItem('heroui-theme')||'dark';var r=t==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t;document.documentElement.classList.add(r);document.documentElement.setAttribute('data-theme',r);}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: applyThemeBeforePaint }} />
      </head>
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
