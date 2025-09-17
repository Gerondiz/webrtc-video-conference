import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    '20.0.0.107',
    '20.0.0.107:3000', // если порт важен
    '20.0.0.107:3001',
    'localhost:3000',
    '127.0.0.1:3000',
    'https://localhost:8000',
    'https://backend-mediasoup.onrender.com'
  ],
  /* config options here */
  output: 'standalone',
  async headers() {

    return [{
      source: '/(.*)',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: "script-src 'self' 'unsafe-eval' 'unsafe-inline';",
        },
      ],
    }]
  },
  reactStrictMode: false,
};

export default nextConfig;
