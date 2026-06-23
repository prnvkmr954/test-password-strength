import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import ToastContainer from '@/components/Toast';

export const metadata: Metadata = {
  title: 'PassGuard — Password Strength & History',
  description:
    'Test and enforce password strength rules with history tracking. Built with Next.js and Express.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="bg-gradient" />
          <Navbar />
          <ToastContainer />
          <main className="main-content">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
