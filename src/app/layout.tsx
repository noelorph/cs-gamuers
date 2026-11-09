import type { Metadata } from 'next';
import '@/styles/globals.css';
import localFont from 'next/font/local';
const inter = localFont({
  src: './fonts/InterVariable.woff2',
  variable: '--font-inter',
  display: 'swap',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'CS-GAMUERS',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en">
      <body
        className={inter.variable}
        style={{ margin: 0, fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
      >
        {children}
      </body>
    </html>
  );
}
