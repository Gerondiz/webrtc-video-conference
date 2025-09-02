// components/VideoPlayer.tsx
'use client';
import { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  stream: MediaStream;
  username: string;
  isLocal: boolean;
}

export default function VideoPlayer({ stream, username, isLocal }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
        {username}
      </div>
    </div>
  );
}