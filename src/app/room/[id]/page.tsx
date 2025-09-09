// app/room/[id]/page.tsx
"use client";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMediaStream } from "@/contexts/MediaStreamContext";
import { useRoomConnection } from "@/hooks/useRoomConnection";
import { useMediasoup } from "@/hooks/useMediasoup";
import { useRoomStore } from "@/stores/useRoomStore";
import RoomHeader from "@/components/RoomPage/RoomHeader";
import VideoGrid from "@/components/RoomPage/VideoGrid";
import ChatPanel from "@/components/RoomPage/ChatPanel";

export default function RoomPage() {
  const router = useRouter();
  const { stream: localStream } = useMediaStream();
  const { roomId, sendChatMessage, leaveRoom, isConnected } = useRoomConnection();

  // ✅ Извлекаем currentUserId из store
  const { users, currentUserId } = useRoomStore();

  // Состояние для удалённых потоков
  const [remoteStreams, setRemoteStreams] = useState<
    Array<{
      userId: string;
      username: string;
      stream: MediaStream;
    }>
  >([]);

  useEffect(() => {
    console.log(
      "📡 Remote streams updated:",
      remoteStreams.map((r) => r.userId)
    );
  }, [remoteStreams]);

  // Инициализация SFU
  const { initializeMediasoup, cleanup } = useMediasoup({
    roomId,
    userId: currentUserId || 'unknown', // ✅ Используем currentUserId
    onRemoteStreamAdded: (stream, userId, username) => {
      setRemoteStreams((prev) => [...prev, { userId, username, stream }]);
    },
    onRemoteStreamRemoved: (userId) => {
      setRemoteStreams((prev) => prev.filter((s) => s.userId !== userId));
    },
  });

  // Запускаем SFU после подключения к WebSocket и получения медиа
useEffect(() => {
  if (isConnected && localStream && currentUserId && currentUserId !== 'unknown') {
    console.log('🔌 Initializing Mediasoup...');
    initializeMediasoup();
  } else {
    console.log('⚠️ Cannot initialize Mediasoup: isConnected:', isConnected, 'localStream:', !!localStream, 'currentUserId:', currentUserId);
  }
}, [isConnected, localStream, currentUserId, initializeMediasoup]); // ✅ currentUserId в зависимостях

  // Очистка при выходе
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // ... остальные функции (toggleMic, toggleVideo, handleLeaveRoom, openSettings) без изменений

  const toggleMic = useCallback(() => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
  }, [localStream]);

  const handleLeaveRoom = useCallback(() => {
    leaveRoom();
    router.push("/");
  }, [leaveRoom, router]);

  const openSettings = useCallback(() => {
    console.log("Open settings");
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      <RoomHeader
        roomId={roomId}
        onToggleMic={toggleMic}
        onToggleVideo={toggleVideo}
        onLeaveRoom={handleLeaveRoom}
        onSettings={openSettings}
      />

      <div className="flex flex-1 overflow-hidden">
        <VideoGrid remoteStreams={remoteStreams} />
        <ChatPanel roomId={roomId} sendMessage={sendChatMessage} />
      </div>
    </div>
  );
}