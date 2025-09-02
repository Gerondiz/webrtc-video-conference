// src/components/RoomPage/VideoContainer.tsx
import VideoPlayer from '@/components/VideoPlayer';

interface VideoContainerProps {
  localStream: MediaStream | null;
  isVideoMuted: boolean;
}

export default function VideoContainer({ localStream, isVideoMuted }: VideoContainerProps) {
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
        
        {/* Здесь будут отображаться удаленные видео потоки */}
        {/* {remoteStreams.map(stream => (
          <VideoPlayer
            key={stream.userId}
            stream={stream.stream}
            username={stream.username}
            isLocal={false}
          />
        ))} */}
      </div>
    </div>
  );
}