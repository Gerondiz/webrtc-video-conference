'use client';

import { useEffect, useRef, useState } from 'react';

interface VideoPlayerProps {
  stream: MediaStream | null;
  isLocal?: boolean;
  muted?: boolean;
  username?: string;
}

export default function VideoPlayer({ stream, isLocal = false, muted = false, username }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasVideo, setHasVideo] = useState(false);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const updateVideoState = () => {
      setHasVideo(videoElement.videoWidth > 0 && videoElement.videoHeight > 0);
    };

    if (stream) {
      videoElement.srcObject = stream;
      videoElement.addEventListener('loadedmetadata', updateVideoState);
      videoElement.addEventListener('resize', updateVideoState);
    } else {
      videoElement.srcObject = null;
      setHasVideo(false);
    }

    return () => {
      videoElement.removeEventListener('loadedmetadata', updateVideoState);
      videoElement.removeEventListener('resize', updateVideoState);
    };
  }, [stream]);

  return (
    <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal || muted}
        className="w-full h-full object-cover"
      />
      {!hasVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="text-white text-center">
            <div className="text-2xl mb-2">🎥</div>
            <div className="text-sm">No video available</div>
          </div>
        </div>
      )}
      {username && (
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
          {username} {isLocal && '(You)'}
        </div>
      )}
    </div>
  );
}