import './globals.css';

export const metadata = {
  title: 'AI 갈틱폰',
  description: 'AI 그림으로 즐기는 릴레이 맞추기 게임',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
