import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import Navbar from './components/Navbar';

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
      <body>
        <Navbar />
        <main>{children}</main>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
