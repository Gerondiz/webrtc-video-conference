// src/components/RoomPage/VideoGrid.tsx
import { useMediaStream } from '@/contexts/MediaStreamContext';
import VideoPlayer from '@/components/VideoPlayer';

interface VideoGridProps {
  remoteStreams: Array<{
    userId: string;
    username: string;
    stream: MediaStream;
  }>;
}

export default function VideoGrid({ remoteStreams }: VideoGridProps) {
  const { stream: localStream } = useMediaStream();

  // Получаем состояние видео из локального потока
  const isVideoMuted = localStream 
    ? !localStream.getVideoTracks().some(track => track.enabled)
    : true;

  return (
    <div className="flex-1 p-4 overflow-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Локальное видео */}
        {localStream && (
          <div className="relative">
            <VideoPlayer
              stream={localStream}
              username="You"
              isLocal={true}
            />
            {isVideoMuted && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <span className="text-white">Video disabled</span>
              </div>
            )}
          </div>
        )}
        
        {/* Удаленные видео потоки */}
        {remoteStreams.map(remote => (
          <VideoPlayer
            key={remote.userId}
            stream={remote.stream}
            username={remote.username}
            isLocal={false}
          />
        ))}
        
        {/* Заглушка, если нет видео */}
        {!localStream && remoteStreams.length === 0 && (
          <div className="col-span-full flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">
              No active video streams
            </p>
          </div>
        )}
      </div>
    </div>
  );
}