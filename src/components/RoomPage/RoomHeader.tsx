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
} from "lucide-react";
import { useMediaStream } from "@/contexts/MediaStreamContext";
import { useRoomStore } from "@/stores/useRoomStore";

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
  const { wsConnected, wsConnecting, users, isMicMuted, isCameraOff } =
    useRoomStore();

  // Подсчитываем только подключенных пользователей
  const connectedUsers = users.filter((user) => user.isConnected);

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
    <header className="p-4 bg-[rgb(var(--background-start-rgb-light))] dark:bg-[rgb(var(--background-start-rgb-dark))] border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-semibold text-[rgb(var(--foreground-rgb-light))] dark:text-[rgb(var(--foreground-rgb-dark))]">
          Room: {roomId}
        </h1>
        <div className="flex items-center space-x-2 text-[rgb(var(--foreground-rgb-light))] dark:text-[rgb(var(--foreground-rgb-dark))]">
          <Users size={20} />
          <span>{users.length} users</span>
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
                ? "fill-green-400 text-green-400"
                : wsConnecting
                ? "fill-yellow-400 text-yellow-400 animate-pulse"
                : "fill-red-400 text-red-400"
            }
          />
          <span className="text-sm text-[rgb(var(--foreground-rgb-light))] dark:text-[rgb(var(--foreground-rgb-dark))]">
            {wsConnected
              ? "Connected"
              : wsConnecting
              ? "Connecting..."
              : "Disconnected"}
          </span>
        </div>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={handleToggleMic}
          className={`p-2 rounded-full ${
            actualIsMicMuted
              ? "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300"
              : "bg-[rgb(var(--primary-button-light))] text-white dark:bg-[rgb(var(--primary-button-dark))]"
          } hover:opacity-90 transition-opacity`}
          title={actualIsMicMuted ? "Unmute microphone" : "Mute microphone"}
          disabled={!localStream}
        >
          {actualIsMicMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        <button
          onClick={handleToggleVideo}
          className={`p-2 rounded-full ${
            actualIsVideoMuted
              ? "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300"
              : "bg-[rgb(var(--primary-button-light))] text-white dark:bg-[rgb(var(--primary-button-dark))]"
          } hover:opacity-90 transition-opacity`}
          title={actualIsVideoMuted ? "Enable video" : "Disable video"}
          disabled={!localStream}
        >
          {actualIsVideoMuted ? <VideoOff size={20} /> : <Video size={20} />}
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
