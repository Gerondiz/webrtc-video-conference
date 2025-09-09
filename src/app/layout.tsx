// src/app/layout.tsx
'use client';
import "./globals.css";
import { ToastProvider } from '@/contexts/ToastContext';
import ToastContainer from '@/components/ToastContainer';
import { MediaStreamProvider } from '@/contexts/MediaStreamContext';
import { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
        <MediaStreamProvider>
          {children}
          <ToastContainer />
        </MediaStreamProvider>
        </ToastProvider>
      </body>
    </html>
  );
}