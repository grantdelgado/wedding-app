import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthSessionWatcher from './components/AuthSessionWatcher'
import ProfileAvatar from './components/ProfileAvatar';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { APP_CONFIG } from '@/lib/constants';
import { Suspense } from 'react';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: APP_CONFIG.name,
  description: APP_CONFIG.description,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased font-sans`}>
        <ErrorBoundary>
          <Suspense>
            <AuthSessionWatcher>
              <div className="absolute top-4 right-4 z-50">
                <ProfileAvatar />
              </div>
              {children}
            </AuthSessionWatcher>
          </Suspense>
        </ErrorBoundary>
      </body>
    </html>
  );
}
