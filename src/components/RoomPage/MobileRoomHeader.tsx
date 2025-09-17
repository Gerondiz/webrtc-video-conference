// src/components/RoomPage/MobileRoomHeader.tsx
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Users,
  Circle,
  MessageSquare,
  MoreVertical,
} from "lucide-react";
import { useMediaStream } from "@/contexts/MediaStreamContext";
import { useRoomStore } from "@/stores/useRoomStore";
import SettingsMenu from "@/components/RoomPage/SettingsMenu";
import { useState } from "react";

interface MobileRoomHeaderProps {
  roomId: string;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onLeaveRoom: () => void;
  onToggleChat: () => void;
  isChatOpen: boolean;
  hasNewMessages?: boolean;
}

export default function MobileRoomHeader({
  roomId,
  onToggleMic,
  onToggleVideo,
  onLeaveRoom,
  onToggleChat,
  isChatOpen,
  hasNewMessages = false
}: MobileRoomHeaderProps) {
  const { stream: localStream } = useMediaStream();
  const { wsConnected, wsConnecting, users, isMicMuted, isCameraOff } =
    useRoomStore();
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showControls, setShowControls] = useState(false);

  // Получаем текущее состояние микрофона и камеры из потока
  const actualIsMicMuted = localStream
    ? !localStream.getAudioTracks().some((track) => track.enabled)
    : isMicMuted;

  const actualIsVideoMuted = localStream
    ? !localStream.getVideoTracks().some((track) => track.enabled)
    : isCameraOff;

  const handleToggleMic = () => {
    onToggleMic();
    useRoomStore.getState().toggleMic();
  };

  const handleToggleVideo = () => {
    onToggleVideo();
    useRoomStore.getState().toggleCamera();
  };

  return (
    <header className="p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Верхняя строка - информация о комнате */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center space-x-2">
          <h1 className="text-lg font-semibold text-gray-800 dark:text-white truncate max-w-[120px]">
            Room: <span className="font-mono text-sm">{roomId}</span>
          </h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-300">
            <Users size={16} />
            <span className="text-sm font-medium">{users.length}</span>
          </div>
          
          <div
            className="flex items-center"
            title={
              wsConnected
                ? "Connected"
                : wsConnecting
                ? "Connecting..."
                : "Disconnected"
            }
          >
            <Circle
              size={10}
              className={
                wsConnected
                  ? "fill-green-500 text-green-500"
                  : wsConnecting
                  ? "fill-yellow-500 text-yellow-500 animate-pulse"
                  : "fill-red-500 text-red-500"
              }
            />
          </div>
        </div>
      </div>

      {/* Кнопки управления - компактная версия */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <button
            onClick={onToggleChat}
            className={`p-2 rounded-full relative ${
              isChatOpen
                ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300"
                : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
            }`}
            title={isChatOpen ? "Close chat" : "Open chat"}
          >
            <MessageSquare size={18} />
            {hasNewMessages && !isChatOpen && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></div>
            )}
          </button>

          <button
            onClick={() => setShowControls(!showControls)}
            className="p-2 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
            title="More controls"
          >
            <MoreVertical size={18} />
          </button>
        </div>

        <div className="flex space-x-2">
          <SettingsMenu 
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            onOpen={() => setIsSettingsOpen(true)}
          />

          <button
            onClick={onLeaveRoom}
            className="p-2 rounded-full bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300"
            title="Leave room"
          >
            <PhoneOff size={18} />
          </button>
        </div>
      </div>

      {/* Раскрывающиеся дополнительные элементы управления */}
      {showControls && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-center space-x-4">
          <button
            onClick={handleToggleMic}
            className={`p-3 rounded-full ${
              actualIsMicMuted
                ? "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300"
                : "bg-blue-500 text-white dark:bg-blue-600"
            }`}
            title={actualIsMicMuted ? "Unmute microphone" : "Mute microphone"}
            disabled={!localStream}
          >
            {actualIsMicMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          <button
            onClick={handleToggleVideo}
            className={`p-3 rounded-full ${
              actualIsVideoMuted
                ? "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300"
                : "bg-blue-500 text-white dark:bg-blue-600"
            }`}
            title={actualIsVideoMuted ? "Enable video" : "Disable video"}
            disabled={!localStream}
          >
            {actualIsVideoMuted ? <VideoOff size={20} /> : <Video size={20} />}
          </button>
        </div>
      )}
    </header>
  );
}