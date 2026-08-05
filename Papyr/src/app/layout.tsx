import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import SupportFooter from '@/components/SupportFooter';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Papyr - Handwritten Digital Ledger',
  description: 'Offline-first handwritten digital ledger designed to replace physical notebooks',
  icons: [
    {
      rel: 'icon',
      url: '/favicon.png',
      type: 'image/png',
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="m-0 p-0">
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <main className="flex-1">
              {children}
            </main>
            <SupportFooter />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
