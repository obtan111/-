import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '云点餐系统',
    template: '%s | 云点餐系统',
  },
  description:
    '基于Next.js和智谱AI向量嵌入的智能云点餐推荐系统，提供语义搜索推荐、在线点餐、订单管理等功能。',
  keywords: [
    '云点餐系统',
    '智能点餐',
    '语义搜索',
    'AI推荐',
    '在线点餐',
    '订单管理',
    'Next.js',
    '智谱AI',
    '向量嵌入',
  ],
  authors: [{ name: '云点餐系统开发团队' }],
  generator: 'Next.js',
  // icons: {
  //   icon: '',
  // },
  openGraph: {
    title: '云点餐系统',
    description:
      '基于Next.js和智谱AI向量嵌入的智能云点餐推荐系统，提供语义搜索推荐、在线点餐、订单管理等功能。',
    siteName: '云点餐系统',
    locale: 'zh_CN',
    type: 'website',
    // images: [
    //   {
    //     url: '',
    //     width: 1200,
    //     height: 630,
    //     alt: '云点餐系统',
    //   },
    // ],
  },
  // twitter: {
  //   card: 'summary_large_image',
  //   title: 'Coze Code | Your AI Engineer is Here',
  //   description:
  //     'Build and deploy full-stack applications through AI conversation. No env setup, just flow.',
  //   // images: [''],
  // },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <html lang="en">
      <body className={`antialiased`}>
        {isDev && <Inspector />}
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
