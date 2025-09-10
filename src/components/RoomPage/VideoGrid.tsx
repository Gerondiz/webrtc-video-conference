// src/components/RoomPage/VideoGrid.tsx
'use client';
import { useMediaStream } from '@/contexts/MediaStreamContext';
import VideoPlayer from '@/components/RoomPage/VideoPlayer';
import { useRoomStore } from '@/stores/useRoomStore';

interface VideoGridProps {
  remoteStreams: Array<{
    userId: string;
    username: string;
    stream: MediaStream;
  }>;
}

export default function VideoGrid({ remoteStreams }: VideoGridProps) {
  const { stream: localStream } = useMediaStream();

  const isVideoMuted = localStream
    ? !localStream.getVideoTracks().some((track) => track.enabled)
    : true;

  // Функция для проверки активности потока
  const isStreamActive = (stream: MediaStream): boolean => {
    try {
      // Проверяем, есть ли активные треки
      const tracks = stream.getTracks();
      const hasActiveTracks = tracks.some(track => {
        const isActive = track.readyState === 'live';
        console.log(`🔍 Track ${track.kind} readyState: ${track.readyState}, active: ${isActive}`);
        return isActive;
      });
      
      console.log(`🔍 Stream check - total tracks: ${tracks.length}, active: ${hasActiveTracks}`);
      return hasActiveTracks && tracks.length > 0;
    } catch (error) {
      console.error('Error checking stream status:', error);
      return false;
    }
  };

  // Фильтруем только активные потоки
const activeRemoteStreams = remoteStreams.filter(remote => {
    // Проверяем, есть ли такой пользователь в списке активных пользователей
    const userExists = useRoomStore.getState().users.some(user => 
        user.id === remote.userId && user.isConnected
    );
    
    const isActive = userExists && remote.stream && isStreamActive(remote.stream, remote.userId, remote.username);
    console.log(`🔍 [${remote.userId} (${remote.username})] User exists: ${userExists}, Stream active: ${isActive}`);
    return isActive;
});

  console.log(`📊 Total remote streams: ${remoteStreams.length}, Active: ${activeRemoteStreams.length}`);

  return (
    <div className="flex-1 p-4 overflow-auto bg-gray-50 dark:bg-gray-900">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Локальное видео */}
        {localStream && (
          <div className="relative rounded-xl overflow-hidden shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
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
          </div>
        )}

        {/* Удаленные видео потоки - только активные */}
        {activeRemoteStreams.map((remote) => (
          <div 
            key={remote.userId} 
            className="relative rounded-xl overflow-hidden shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
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

        {/* Показываем сообщение, если нет активных потоков */}
        {!localStream && activeRemoteStreams.length === 0 && (
          <div className="col-span-full flex items-center justify-center h-64 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="text-gray-400 dark:text-gray-500 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                No active video streams
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                Waiting for participants...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}