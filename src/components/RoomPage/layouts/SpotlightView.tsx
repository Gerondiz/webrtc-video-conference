// src/components/RoomPage/layouts/SpotlightView.tsx
'use client';
import { useState, useMemo } from 'react';
import { useMediaStream } from '@/contexts/MediaStreamContext';
import VideoPlayer from '@/components/RoomPage/VideoPlayer';
import { useRoomStore } from '@/stores/useRoomStore';

interface VideoStream {
  userId: string;
  username: string;
  stream: MediaStream;
}

interface SpotlightViewProps {
  remoteStreams: VideoStream[];
}

interface SpotlightStream {
  stream: MediaStream;
  username: string;
  isLocal: boolean;
}

export default function SpotlightView({ remoteStreams }: SpotlightViewProps) {
  const { stream: localStream } = useMediaStream();
  const users = useRoomStore(state => state.users);
  const [spotlightUserId, setSpotlightUserId] = useState<string | null>(null);

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

  // Обработка клика по участнику для spotlight
  const handleParticipantClick = (userId: string) => {
    if (spotlightUserId === userId) {
      setSpotlightUserId(null);
    } else {
      setSpotlightUserId(userId);
    }
  };

  // Получаем spotlight поток
  const spotlightStream = useMemo((): SpotlightStream | null => {
    if (spotlightUserId === 'local') {
      return localStream ? { stream: localStream, username: 'You (Spotlight)', isLocal: true } : null;
    }
    const stream = activeStreams.find(stream => stream.userId === spotlightUserId);
    return stream ? { stream: stream.stream, username: `${stream.username} (Spotlight)`, isLocal: false } : null;
  }, [spotlightUserId, localStream, activeStreams]);

  return (
    <div className="flex-1 flex flex-col bg-gray-900 overflow-hidden">
      {/* Основное видео (spotlight) */}
      <div className="flex-1 p-4">
        {spotlightStream ? (
          <div className="w-full h-full rounded-xl overflow-hidden shadow-lg bg-gray-800 relative">
            <VideoPlayer
              stream={spotlightStream.stream}
              username={spotlightStream.username}
              isLocal={spotlightStream.isLocal}
            />
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded-full">
              {spotlightStream.username}
            </div>
          </div>
        ) : (
          <div className="w-full h-full rounded-xl overflow-hidden shadow-lg bg-gray-800 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-lg">Click on a participant to spotlight</p>
            </div>
          </div>
        )}
      </div>

      {/* Миниатюры участников */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex space-x-4 overflow-x-auto pb-2">
          {localStream && (
            <div 
              className={`flex-shrink-0 w-32 h-24 rounded-lg overflow-hidden cursor-pointer ${
                spotlightUserId === 'local' ? 'ring-2 ring-blue-500' : 'ring-1 ring-gray-600'
              }`}
              onClick={() => handleParticipantClick('local')}
            >
              <VideoPlayer
                stream={localStream}
                username="You"
                isLocal={true}
              />
              <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                You
              </div>
            </div>
          )}
          
          {activeStreams.map(stream => (
            <div 
              key={stream.userId}
              className={`flex-shrink-0 w-32 h-24 rounded-lg overflow-hidden cursor-pointer ${
                spotlightUserId === stream.userId ? 'ring-2 ring-blue-500' : 'ring-1 ring-gray-600'
              }`}
              onClick={() => handleParticipantClick(stream.userId)}
            >
              <VideoPlayer
                stream={stream.stream}
                username={stream.username}
                isLocal={false}
              />
              <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                {stream.username}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}