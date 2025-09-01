import React from 'react';
import { Users } from 'lucide-react';
import { useRoomStore } from '../../stores/useRoomStore';
import  VideoPlayer  from '@/components/VideoPlayer';

interface VideoGridProps {
  username: string;
}

export const VideoGrid: React.FC<VideoGridProps> = ({ username }) => {
  const { localStream, remoteStreams } = useRoomStore();
  
  return (
    <div className="flex-1 p-4 overflow-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
        {/* Local video */}
        {localStream && (
          <div className="bg-gray-800 rounded-lg overflow-hidden aspect-video">
            <VideoPlayer stream={localStream} isLocal username={username} />
          </div>
        )}
        {/* Remote videos */}
        {remoteStreams.map((remote) => (
          <div key={remote.userId} className="bg-gray-800 rounded-lg overflow-hidden aspect-video">
            <VideoPlayer stream={remote.stream} username={remote.username} />
          </div>
        ))}
        {/* Placeholder for empty slots */}
        {remoteStreams.length === 0 && (
          <div className="bg-gray-800 rounded-lg aspect-video flex items-center justify-center">
            <div className="text-center">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p className="opacity-50">Waiting for others to join...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};