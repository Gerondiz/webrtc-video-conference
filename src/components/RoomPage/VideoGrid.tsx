// src/components/RoomPage/VideoGrid.tsx
'use client';
import { useMediaStream } from '@/contexts/MediaStreamContext';
import VideoPlayer from '@/components/RoomPage/VideoPlayer';
import RemoteVideoItem from '@/components/RoomPage/RemoteVideoItem';
import { useRoomStore } from '@/stores/useRoomStore';
import { useAudioActivity } from '@/hooks/useAudioActivity';

interface VideoStream {
  userId: string;
  username: string;
  stream: MediaStream;
}

interface VideoGridProps {
  remoteStreams: VideoStream[];
}

export default function VideoGrid({ remoteStreams }: VideoGridProps) {
  const { stream: localStream } = useMediaStream();
  const users = useRoomStore(state => state.users);
  
  // Получаем данные об активности для локального потока
  const { isSpeaking: localIsSpeaking } = 
    useAudioActivity(localStream, { threshold: 0.03 });

  // Фильтруем активные потоки
  const activeStreams = remoteStreams.filter(remote => {
    const userExists = users.some(user => 
      user.id === remote.userId && user.isConnected
    );
    
    const isStreamActive = remote.stream && 
      remote.stream.getTracks().some(track => track.readyState === 'live');
    
    return userExists && isStreamActive;
  });

  return (
    <div className="flex-1 p-4 overflow-auto bg-gray-900">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {/* Локальное видео */}
        {localStream && (
          <div className="relative rounded-xl overflow-hidden shadow-lg bg-gray-800 border-2 border-gray-700">
            {localIsSpeaking && (
              <div className="absolute inset-0 border-2 border-green-500 rounded-xl pointer-events-none animate-pulse"></div>
            )}
            <VideoPlayer
              stream={localStream}
              username="You"
              isLocal={true}
            />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
              You
            </div>
            {localIsSpeaking && (
              <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                Speaking
              </div>
            )}
          </div>
        )}

        {/* Удаленные видео потоки */}
{activeStreams.map((remote) => (
  <RemoteVideoItem
    key={remote.userId}
    userId={remote.userId}
    username={remote.username}
    stream={remote.stream}
  />
))}

        {/* Пустое состояние */}
        {(!localStream || activeStreams.length === 0) && (
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