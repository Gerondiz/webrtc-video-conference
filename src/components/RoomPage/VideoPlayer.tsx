// components/VideoPlayer.tsx
'use client';
import { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  stream: MediaStream;
  username: string;
  isLocal: boolean;
}

export default function VideoPlayer({ stream, isLocal }: VideoPlayerProps) {
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
    </div>
  );
}