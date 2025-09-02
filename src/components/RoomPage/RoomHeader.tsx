// src/components/RoomPage/RoomHeader.tsx
import { Mic, MicOff, Video, VideoOff, PhoneOff, Settings } from 'lucide-react';
import { useMediaStream } from '@/contexts/MediaStreamContext';

interface RoomHeaderProps {
  roomId: string;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onLeaveRoom: () => void;
  onSettings: () => void;
}

export default function RoomHeader({
  roomId,
  onToggleMic,
  onToggleVideo,
  onLeaveRoom,
  onSettings,
}: RoomHeaderProps) {
  const { stream: localStream } = useMediaStream();
  
  // Получаем текущее состояние микрофона и камеры из потока
  const isMicMuted = localStream 
    ? !localStream.getAudioTracks().some(track => track.enabled)
    : true;
    
  const isVideoMuted = localStream 
    ? !localStream.getVideoTracks().some(track => track.enabled)
    : true;

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
          Room: {roomId}
        </h1>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={onToggleMic}
          className={`p-2 rounded-full ${
            isMicMuted
              ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}
          title={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
          disabled={!localStream}
        >
          {isMicMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        <button
          onClick={onToggleVideo}
          className={`p-2 rounded-full ${
            isVideoMuted
              ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}
          title={isVideoMuted ? 'Enable video' : 'Disable video'}
          disabled={!localStream}
        >
          {isVideoMuted ? <VideoOff size={20} /> : <Video size={20} />}
        </button>

        <button
          onClick={onSettings}
          className="p-2 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
          title="Settings"
          disabled={!localStream}
        >
          <Settings size={20} />
        </button>

        <button
          onClick={onLeaveRoom}
          className="p-2 rounded-full bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300"
          title="Leave room"
        >
          <PhoneOff size={20} />
        </button>
      </div>
    </header>
  );
}