// src/components/RoomPage/RemoteVideoItem.tsx
'use client';
import VideoPlayer from '@/components/RoomPage/VideoPlayer';
import { useAudioActivity } from '@/hooks/useActiveSpeakerDetection';

interface RemoteVideoItemProps {
  userId: string;
  username: string;
  stream: MediaStream;
}

export default function RemoteVideoItem({ userId, username, stream }: RemoteVideoItemProps) {
  const { isSpeaking } = useAudioActivity(stream, { threshold: 0.03 });

  return (
    <div 
      key={userId} 
      className="relative rounded-xl overflow-hidden shadow-lg bg-gray-800 border-2 border-gray-700"
    >
      {isSpeaking && (
        <div className="absolute inset-0 border-2 border-green-500 rounded-xl pointer-events-none animate-pulse"></div>
      )}
      <VideoPlayer
        stream={stream}
        username={username}
        isLocal={false}
      />
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
        {username}
      </div>
      {isSpeaking && (
        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
          Speaking
        </div>
      )}
    </div>
  );
}