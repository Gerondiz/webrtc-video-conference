// src/components/RoomPage/RoomHeader.tsx
import { Mic, MicOff, Video, VideoOff, PhoneOff, Settings, Users, Wifi, WifiOff } from 'lucide-react';
import { useMediaStream } from '@/contexts/MediaStreamContext';

interface RoomHeaderProps {
  roomId: string;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onLeaveRoom: () => void;
  onSettings: () => void;
  userCount: number;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
}

export default function RoomHeader({
  roomId,
  onToggleMic,
  onToggleVideo,
  onLeaveRoom,
  onSettings,
  userCount,
  connectionStatus,
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
    <header className="p-4 bg-[rgb(var(--background-start-rgb-light))] dark:bg-[rgb(var(--background-start-rgb-dark))] border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-semibold text-[rgb(var(--foreground-rgb-light))] dark:text-[rgb(var(--foreground-rgb-dark))]">
          Room: {roomId}
        </h1>
        <div className="flex items-center space-x-2 text-[rgb(var(--foreground-rgb-light))] dark:text-[rgb(var(--foreground-rgb-dark))]">
          <Users size={20} />
          <span>{userCount} users</span>
        </div>
        <div className="flex items-center space-x-2">
          {connectionStatus === 'connected' ? (
            <Wifi size={20} className="text-green-400" />
          ) : connectionStatus === 'connecting' ? (
            <Wifi size={20} className="text-yellow-400 animate-pulse" />
          ) : (
            <WifiOff size={20} className="text-red-400" />
          )}
          <span className="text-[rgb(var(--foreground-rgb-light))] dark:text-[rgb(var(--foreground-rgb-dark))]">
            {connectionStatus === 'connected'
              ? 'Connected'
              : connectionStatus === 'connecting'
              ? 'Connecting...'
              : 'Disconnected'}
          </span>
        </div>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={onToggleMic}
          className={`p-2 rounded-full ${
            isMicMuted
              ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300'
              : 'bg-[rgb(var(--primary-button-light))] text-white dark:bg-[rgb(var(--primary-button-dark))]'
          } hover:opacity-90 transition-opacity`}
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
              : 'bg-[rgb(var(--primary-button-light))] text-white dark:bg-[rgb(var(--primary-button-dark))]'
          } hover:opacity-90 transition-opacity`}
          title={isVideoMuted ? 'Enable video' : 'Disable video'}
          disabled={!localStream}
        >
          {isVideoMuted ? <VideoOff size={20} /> : <Video size={20} />}
        </button>

        <button
          onClick={onSettings}
          className="p-2 rounded-full bg-[rgb(var(--secondary-button-light))] text-white dark:bg-[rgb(var(--secondary-button-dark))] hover:opacity-90 transition-opacity"
          title="Settings"
          disabled={!localStream}
        >
          <Settings size={20} />
        </button>

        <button
          onClick={onLeaveRoom}
          className="p-2 rounded-full bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300 hover:opacity-90 transition-opacity"
          title="Leave room"
        >
          <PhoneOff size={20} />
        </button>
      </div>
    </header>
  );
}