import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { SpeedInsights } from "@vercel/speed-insights/next"

export const metadata: Metadata = {
  title: 'Fantasy Player Predictor',
  description: 'Predicting fantasy basketball player performance',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
