import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '在我死去之前，我想……',
  description: '一件数字公共艺术作品。每个人匿名留下一句话。',
  keywords: ['公共艺术', '数字艺术', '黑板', '无限画布'],
  openGraph: {
    title: '在我死去之前，我想……',
    description: '一件数字公共艺术作品。',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        {/* 霞鹜文楷——开源中文字体 */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/style.css"
        />
      </head>
      <body className="no-select">{children}</body>
    </html>
  );
}
