import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import Header from './components/Header';
import Providers from './components/Providers';

export const metadata: Metadata = {
  title: 'Swishlytics',
  description: 'Fantasy Basketball tools, and more!',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <Providers>
          <Header />
          <main className="flex-grow main-app-container">{children}</main>
        </Providers>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
