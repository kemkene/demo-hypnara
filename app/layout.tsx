import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hypnara — AI Sleep & Digital Wellbeing Coach',
  description: 'Ứng dụng hỗ trợ tối ưu giấc ngủ, quản lý thời gian sử dụng màn hình (Screen Time) và huấn luyện kỷ luật bản thân bằng AI DeepSeek.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
