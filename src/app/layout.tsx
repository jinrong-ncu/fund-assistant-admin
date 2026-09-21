import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from 'next-themes';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { AuthProvider } from '@/features/auth/AuthContext';
import './globals.css';

export const metadata: Metadata = {
  title: '估值助手 · 管理控制台',
  description: '面向微信小程序估值助手的独立运营管理后台',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased text-foreground">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <QueryProvider>
            <AuthProvider>{children}</AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
