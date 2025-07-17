import React from 'react';
import '../globals.css';

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <main className="flex items-center justify-center h-screen bg-gray-100">
          <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
