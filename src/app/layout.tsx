// src/app/layout.tsx
'use client';
import "./globals.css";
import { MediaStreamProvider } from '@/contexts/MediaStreamContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <MediaStreamProvider>
          {children}
        </MediaStreamProvider>
      </body>
    </html>
  );
}