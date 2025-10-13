import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    '20.0.0.107',
    '20.0.0.107:3000', // если порт важен
    '20.0.0.107:3001',
    '192.168.1.105', // если порт важен
    '192.168.1.105:3001',
    'localhost:3000',
    '127.0.0.1:3000',
    'https://localhost:8000',
    'https://backend-mediasoup.onrender.com',
    'https://109.238.92.48:3001',
    'https://s1367541.smartape-vps.com',
    'https://cdn.jsdelivr.net/',
    'https://storage.googleapis.com/',
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm/vision_wasm_internal.js',
  ],
  /* config options here */
  output: 'standalone',
  async headers() {

    return [{
      source: '/(.*)',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: `
            script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net;
            style-src 'self' 'unsafe-inline';
            img-src 'self' data: https:;
            frame-src 'self';
            object-src 'none';
            base-uri 'self';
          `.replace(/\s+/g, ' ').trim(),
        },
      ],
    }]
  },
  reactStrictMode: false,
};

export default nextConfig;
