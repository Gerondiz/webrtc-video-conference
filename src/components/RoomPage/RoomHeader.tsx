// src/components/RoomPage/RoomHeader.tsx
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Settings,
  Users,
  Circle,
  MessageSquare,
} from "lucide-react";
import { useMediaStream } from "@/contexts/MediaStreamContext";
import { useRoomStore } from "@/stores/useRoomStore";

interface RoomHeaderProps {
  roomId: string;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onLeaveRoom: () => void;
  onSettings: () => void;
  onToggleChat: () => void;
  isChatOpen: boolean;
  hasNewMessages?: boolean; // ✅ Добавляем пропс
}

export default function RoomHeader({
  roomId,
  onToggleMic,
  onToggleVideo,
  onLeaveRoom,
  onSettings,
  onToggleChat,
  isChatOpen,
  hasNewMessages = false // ✅ Деструктуризация с дефолтным значением
}: RoomHeaderProps) {
  const { stream: localStream } = useMediaStream();
  const { wsConnected, wsConnecting, users, isMicMuted, isCameraOff } =
    useRoomStore();

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
    <header className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center shadow-sm">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
          Room: <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{roomId}</span>
        </h1>
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30">
            <Users size={18} />
          </div>
          <span className="font-medium">{users.length}</span>
        </div>
        <div
          className="flex items-center space-x-2"
          title={
            wsConnected
              ? "Connected"
              : wsConnecting
              ? "Connecting..."
              : "Disconnected"
          }
        >
          <Circle
            size={12}
            className={
              wsConnected
                ? "fill-green-500 text-green-500"
                : wsConnecting
                ? "fill-yellow-500 text-yellow-500 animate-pulse"
                : "fill-red-500 text-red-500"
            }
          />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {wsConnected
              ? "Online"
              : wsConnecting
              ? "Connecting..."
              : "Offline"}
          </span>
        </div>
      </div>
      
      <div className="flex space-x-2">
        <button
          onClick={onToggleChat}
          className={`p-2 rounded-full relative transition-all duration-200 ${
            isChatOpen
              ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 shadow-inner"
              : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
          }`}
          title={isChatOpen ? "Close chat" : "Open chat"}
        >
          <MessageSquare size={20} />
          {/* Индикатор новых сообщений */}
          {hasNewMessages && !isChatOpen && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></div>
          )}
        </button>

        <button
          onClick={handleToggleMic}
          className={`p-2 rounded-full transition-all duration-200 ${
            actualIsMicMuted
              ? "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300 shadow-inner"
              : "bg-blue-500 text-white dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 shadow-md"
          }`}
          title={actualIsMicMuted ? "Unmute microphone" : "Mute microphone"}
          disabled={!localStream}
        >
          {actualIsMicMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        <button
          onClick={handleToggleVideo}
          className={`p-2 rounded-full transition-all duration-200 ${
            actualIsVideoMuted
              ? "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300 shadow-inner"
              : "bg-blue-500 text-white dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 shadow-md"
          }`}
          title={actualIsVideoMuted ? "Enable video" : "Disable video"}
          disabled={!localStream}
        >
          {actualIsVideoMuted ? <VideoOff size={20} /> : <Video size={20} />}
        </button>

        <button
          onClick={onSettings}
          className="p-2 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 shadow-md"
          title="Settings"
          disabled={!localStream}
        >
          <Settings size={20} />
        </button>

        <button
          onClick={onLeaveRoom}
          className="p-2 rounded-full bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800/50 transition-all duration-200 shadow-md"
          title="Leave room"
        >
          <PhoneOff size={20} />
        </button>
      </div>
    </header>
  );
}