// components/VideoPlayer.tsx
'use client';
import { useEffect, useRef } from 'react';
import { MicOff } from 'lucide-react';

interface VideoPlayerProps {
  stream: MediaStream;
  username: string;
  isLocal: boolean;
  isMicMuted?: boolean; // ← новое свойство
}

export default function VideoPlayer({ stream, isLocal, isMicMuted = false }: VideoPlayerProps) {
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
      {/* Иконка выключенного микрофона */}
      {isMicMuted && (
        <div className="absolute top-2 right-2 bg-red-500 rounded-full p-1.5 z-10">
          <MicOff size={16} className="text-white" />
        </div>
      )}
    </div>
  );
}