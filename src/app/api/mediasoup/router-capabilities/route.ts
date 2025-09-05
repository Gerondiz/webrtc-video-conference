import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('roomId');
  
  if (!roomId) {
    return NextResponse.json(
      { error: 'Missing roomId' }, 
      { status: 400 }
    );
  }

  // Здесь должен быть запрос к твоему Mediasoup серверу
  // Для примера возвращаем заглушку
  return NextResponse.json({
    codecs: [
      { mimeType: 'audio/opus', clockRate: 48000, channels: 2 },
      { mimeType: 'video/VP8', clockRate: 90000 }
    ],
    headerExtensions: [
      { uri: 'urn:ietf:params:rtp-hdrext:sdes:mid' }
    ]
  });
}