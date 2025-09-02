// src/components/RoomPage/VideoGrid.tsx
'use client';
import React from 'react';
import VideoPlayer from '@/components/VideoPlayer';
import { useRoomStore } from '@/stores/useRoomStore';

interface VideoGridProps {
  username: string;
}

export const VideoGrid: React.FC<VideoGridProps> = ({ username }) => {
  const { remoteStreams, localStream } = useRoomStore();
  
  // Проверяем, что remoteStreams определен и является массивом
  const validRemoteStreams = Array.isArray(remoteStreams) ? remoteStreams : [];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      {/* Local video */}
      {localStream && (
        <div className="bg-gray-800 rounded-lg overflow-hidden aspect-video">
          <VideoPlayer stream={localStream} username={username} isLocal={true} />
        </div>
      )}
      
      {/* Remote videos */}
      {validRemoteStreams.map((remote) => (
        <div key={remote.userId} className="bg-gray-800 rounded-lg overflow-hidden aspect-video">
          <VideoPlayer stream={remote.stream} username={remote.username} />
        </div>
      ))}
    </div>
  );
};