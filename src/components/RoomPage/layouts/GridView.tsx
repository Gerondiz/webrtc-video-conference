// src/components/RoomPage/layouts/GridView.tsx
'use client';
import { useMemo } from 'react';
import { useMediaStream } from '@/contexts/MediaStreamContext';
import VideoPlayer from '@/components/RoomPage/VideoPlayer';
import { useRoomStore } from '@/stores/useRoomStore';

interface VideoStream {
  userId: string;
  username: string;
  stream: MediaStream;
}

interface GridViewProps {
  remoteStreams: VideoStream[];
}

export default function GridView({ remoteStreams }: GridViewProps) {
  const { stream: localStream } = useMediaStream();
  const users = useRoomStore(state => state.users);

  // Фильтруем активные потоки
  const activeStreams = useMemo(() => {
    return remoteStreams.filter(remote => {
      const userExists = users.some(user => 
        user.id === remote.userId && user.isConnected
      );
      
      const isStreamActive = remote.stream && 
        remote.stream.getTracks().some(track => track.readyState === 'live');
      
      return userExists && isStreamActive;
    });
  }, [remoteStreams, users]);

  // Общее количество активных участников (включая себя)
  const totalParticipants = useMemo(() => {
    return (localStream ? 1 : 0) + activeStreams.length;
  }, [localStream, activeStreams.length]);

  // Вычисляем оптимальное количество колонок на основе количества участников
  const columns = useMemo(() => {
    if (totalParticipants <= 1) return 1;
    if (totalParticipants <= 4) return 2;
    if (totalParticipants <= 9) return 3;
    if (totalParticipants <= 16) return 4;
    return 5; // максимум 5 колонок
  }, [totalParticipants]);

  return (
    <div className="flex-1 p-4 overflow-hidden bg-gray-900">
      <div 
        className="grid gap-4 h-full"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        }}
      >
        {localStream && (
          <div className="relative rounded-xl overflow-hidden shadow-lg bg-gray-800 border border-gray-700">
            <VideoPlayer
              stream={localStream}
              username="You"
              isLocal={true}
            />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
              You
            </div>
          </div>
        )}

        {activeStreams.map((remote) => (
          <div 
            key={remote.userId}
            className="relative rounded-xl overflow-hidden shadow-lg bg-gray-800 border border-gray-700"
          >
            <VideoPlayer
              stream={remote.stream}
              username={remote.username}
              isLocal={false}
            />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
              {remote.username}
            </div>
          </div>
        ))}

        {totalParticipants === 0 && (
          <div className="col-span-full flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-gray-500 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-400 text-lg font-medium">
                No active video streams
              </p>
              <p className="text-gray-500 text-sm mt-1">
                Waiting for participants...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}