// app/api/tunnel-url/route.ts

import { NextRequest } from 'next/server';

// Простое хранилище в памяти (сбросится при перезапуске сервера)
let tunnelUrl: string | null = null;

export async function GET(request: NextRequest) {
  if (!tunnelUrl) {
    return new Response(
      JSON.stringify({ error: 'Tunnel URL not set' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ url: tunnelUrl }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ error: 'URL is required and must be a string' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    tunnelUrl = url;
    console.log('✅ Tunnel URL updated to:', tunnelUrl);

    return new Response(
      JSON.stringify({ success: true, url: tunnelUrl }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error updating tunnel URL:', error);
    return new Response(
      JSON.stringify({ error: 'Invalid request body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}