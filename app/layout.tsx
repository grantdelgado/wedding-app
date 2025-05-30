import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthSessionWatcher from './components/AuthSessionWatcher'
import ProfileAvatar from './components/ProfileAvatar';
import { Suspense } from 'react';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Unveil",
  description: "Focus on presence, not logistics. Streamline wedding communication and preserve shared memories in one elegant space.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased font-sans`}>
        <Suspense>
          <AuthSessionWatcher>
            <div className="absolute top-4 right-4 z-50">
              <ProfileAvatar />
            </div>
            {children}
          </AuthSessionWatcher>
        </Suspense>
      </body>
    </html>
  );
}
