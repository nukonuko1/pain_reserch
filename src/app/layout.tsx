import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';

export const metadata: Metadata = {
  title: '痛みリサーチツール',
  description: 'ユーザーの痛みを分析・スコアリングして商品アイデアを生成',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      <body className="h-full bg-gray-50 text-gray-900 antialiased">
        <div className="flex h-full overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-6xl mx-auto px-6 py-8 pt-16 lg:pt-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
