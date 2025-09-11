// src/components/RoomPage/AdaptiveVideoGrid.tsx
'use client';
import { useState, useEffect, useMemo } from 'react';
import { useMediaStream } from '@/contexts/MediaStreamContext';
import VideoPlayer from '@/components/VideoPlayer';
import { useRoomStore } from '@/stores/useRoomStore';

interface VideoStream {
  userId: string;
  username: string;
  stream: MediaStream;
  isSpeaking?: boolean; // Для определения активного докладчика
  audioLevel?: number;  // Уровень звука для активности
}

interface AdaptiveVideoGridProps {
  remoteStreams: VideoStream[];
  onSpotlightChange?: (userId: string | null) => void;
}

export default function AdaptiveVideoGrid({ 
  remoteStreams, 
  onSpotlightChange 
}: AdaptiveVideoGridProps) {
  const { stream: localStream } = useMediaStream();
  const users = useRoomStore(state => state.users);
  const [spotlightUserId, setSpotlightUserId] = useState<string | null>(null);
  const [gridMode, setGridMode] = useState<'gallery' | 'spotlight'>('gallery');
  
  // Фильтруем активные потоки
  const activeStreams = useMemo(() => {
    return remoteStreams.filter(remote => {
      const userExists = users.some(user => 
        user.id === remote.userId && user.isConnected
      );
      
      // Проверяем активность потока
      const isStreamActive = remote.stream && 
        remote.stream.getTracks().some(track => track.readyState === 'live');
      
      return userExists && isStreamActive;
    });
  }, [remoteStreams, users]);

  // Общее количество активных участников (включая себя)
  const totalParticipants = (localStream ? 1 : 0) + activeStreams.length;

  // Определяем режим отображения
  useEffect(() => {
    if (totalParticipants <= 2) {
      setGridMode('spotlight');
    } else {
      setGridMode('gallery');
    }
  }, [totalParticipants]);

  // Определяем количество колонок для галереи
  const gridColumns = useMemo(() => {
    if (totalParticipants <= 1) return 1;
    if (totalParticipants <= 4) return 2;
    if (totalParticipants <= 9) return 3;
    if (totalParticipants <= 16) return 4;
    return 5; // максимум 5 колонок
  }, [totalParticipants]);

  // Обработка клика по участнику для spotlight
  const handleParticipantClick = (userId: string) => {
    if (spotlightUserId === userId) {
      setSpotlightUserId(null);
      onSpotlightChange?.(null);
    } else {
      setSpotlightUserId(userId);
      onSpotlightChange?.(userId);
    }
  };

  // Рендер локального видео
  const renderLocalVideo = () => {
    if (!localStream) return null;

    const isVideoMuted = !localStream.getVideoTracks().some(track => track.enabled);

    return (
      <div 
        className={`relative rounded-xl overflow-hidden shadow-lg bg-gray-800 border border-gray-700 cursor-pointer transform transition-transform hover:scale-[1.02] ${
          gridMode === 'spotlight' && totalParticipants > 1 ? 'order-first' : ''
        }`}
        onClick={() => handleParticipantClick('local')}
      >
        <VideoPlayer
          stream={localStream}
          username="You"
          isLocal={true}
        />
        {isVideoMuted && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <span className="text-white text-sm font-medium bg-black bg-opacity-30 px-3 py-1 rounded-full">
              Camera off
            </span>
          </div>
        )}
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
          You
        </div>
        {spotlightUserId === 'local' && (
          <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
            Spotlight
          </div>
        )}
      </div>
    );
  };

  // Рендер удаленных видео
  const renderRemoteVideos = () => {
    return activeStreams.map((remote) => (
      <div 
        key={remote.userId}
        className={`relative rounded-xl overflow-hidden shadow-lg bg-gray-800 border border-gray-700 cursor-pointer transform transition-transform hover:scale-[1.02] ${
          spotlightUserId === remote.userId ? 'ring-2 ring-blue-500 ring-opacity-75' : ''
        }`}
        onClick={() => handleParticipantClick(remote.userId)}
      >
        <VideoPlayer
          stream={remote.stream}
          username={remote.username}
          isLocal={false}
        />
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
          {remote.username}
        </div>
        {spotlightUserId === remote.userId && (
          <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
            Spotlight
          </div>
        )}
        {/* Индикатор активности речи */}
        {remote.isSpeaking && (
          <div className="absolute inset-0 border-2 border-green-500 rounded-xl pointer-events-none"></div>
        )}
      </div>
    ));
  };

  // Spotlight режим (1-2 участника)
  if (gridMode === 'spotlight' && totalParticipants <= 2) {
    return (
      <div className="flex-1 p-4 overflow-auto bg-gray-900">
        <div className="h-full flex flex-col">
          {/* Основное видео */
          spotlightUserId ? (
            <div className="flex-1 mb-4">
              {spotlightUserId === 'local' && localStream ? (
                <div className="w-full h-full rounded-xl overflow-hidden shadow-lg bg-gray-800">
                  <VideoPlayer
                    stream={localStream}
                    username="You (Spotlight)"
                    isLocal={true}
                  />
                  <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded-full">
                    You (Spotlight)
                  </div>
                </div>
              ) : (
                activeStreams
                  .filter(stream => stream.userId === spotlightUserId)
                  .map(stream => (
                    <div key={stream.userId} className="w-full h-full rounded-xl overflow-hidden shadow-lg bg-gray-800">
                      <VideoPlayer
                        stream={stream.stream}
                        username={`${stream.username} (Spotlight)`}
                        isLocal={false}
                      />
                      <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded-full">
                        {stream.username} (Spotlight)
                      </div>
                    </div>
                  ))
              )}
            </div>
          ) : (
            <div className="flex-1 mb-4 flex items-center justify-center">
              <div className="text-gray-500 text-lg">
                Click on a participant to spotlight
              </div>
            </div>
          )}

          {/* Миниатюры */
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

  // Галерея режим
  return (
    <div className="flex-1 p-4 overflow-auto bg-gray-900">
      <div className={`grid gap-4 ${
        gridColumns === 1 ? 'grid-cols-1' :
        gridColumns === 2 ? 'grid-cols-1 md:grid-cols-2' :
        gridColumns === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
        gridColumns === 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' :
        'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
      }`}>
        {localStream && renderLocalVideo()}
        {renderRemoteVideos()}

        {/* Пустое состояние */
        {totalParticipants === 0 && (
          <div className="col-span-full flex items-center justify-center h-64 bg-gray-800 rounded-xl shadow">
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