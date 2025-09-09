// src/app/layout.tsx
'use client';
import "./globals.css";
import { MediaStreamProvider } from '@/contexts/MediaStreamContext';
import { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MediaStreamProvider>
          {children}
        </MediaStreamProvider>
      </body>
    </html>
  );
}