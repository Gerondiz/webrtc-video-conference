// app/room/[id]/page.tsx
"use client";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMediaStream } from "@/contexts/MediaStreamContext";
import { useRoomConnection } from "@/hooks/useRoomConnection";
import { useMediasoup } from "@/hooks/useMediasoup";
import { useRoomStore } from "@/stores/useRoomStore";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useChatPanel } from "@/hooks/useChatPanel";
import RoomHeader from "@/components/RoomPage/RoomHeader";
import MobileRoomHeader from "@/components/RoomPage/MobileRoomHeader";
import AdaptiveVideoGrid from '@/components/RoomPage/AdaptiveVideoGrid';
import ChatPanel from "@/components/RoomPage/ChatPanel";

export default function RoomPage() {
  const router = useRouter();
  const { stream: localStream, toggleAudio, toggleVideo } = useMediaStream(); // ✅ Получаем toggleAudio/toggleVideo
  const { isChatOpen, hasNewMessages, toggleChat } = useChatPanel();

  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://backend-mediasoup.onrender.com/wss';
  const webSocket = useWebSocket(wsUrl);
  const { isConnected } = webSocket;

  // ✅ Передаем общий WebSocket в useRoomConnection
  const { roomId, sendChatMessage, leaveRoom } = useRoomConnection({
    webSocket,
  });

  // ✅ Извлекаем currentUserId из store
  const { currentUserId } = useRoomStore();

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
    userId: currentUserId || "unknown",
    onRemoteStreamAdded: (stream, userId, username) => {
      setRemoteStreams((prev) => [...prev, { userId, username, stream }]);
    },
    onRemoteStreamRemoved: (userId) => {
      setRemoteStreams((prev) => prev.filter((s) => s.userId !== userId));
    },
    webSocket,
  });

  // Запускаем SFU после подключения к WebSocket и получения медиа
  useEffect(() => {
    if (
      isConnected &&
      localStream &&
      currentUserId &&
      currentUserId !== "unknown"
    ) {
      console.log("🔌 Initializing Mediasoup...");
      initializeMediasoup();
    } else {
      console.log(
        "⚠️ Cannot initialize Mediasoup: isConnected:",
        isConnected,
        "localStream:",
        !!localStream,
        "currentUserId:",
        currentUserId
      );
    }
  }, [isConnected, localStream, currentUserId, initializeMediasoup]);

  // Очистка при выходе
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const handleLeaveRoom = useCallback(() => {
    leaveRoom();
    router.push("/");
  }, [leaveRoom, router]);

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Десктопный заголовок */}
      <div className="hidden md:block">
        <RoomHeader
          roomId={roomId}
          onToggleMic={toggleAudio} 
          onToggleVideo={toggleVideo}
          onLeaveRoom={handleLeaveRoom}
          onToggleChat={toggleChat}
          isChatOpen={isChatOpen}
          hasNewMessages={hasNewMessages}
        />
      </div>
      
      {/* Мобильный заголовок */}
      <div className="md:hidden">
        <MobileRoomHeader
          roomId={roomId}
          onToggleMic={toggleAudio}
          onToggleVideo={toggleVideo}
          onLeaveRoom={handleLeaveRoom}
          onToggleChat={toggleChat}
          isChatOpen={isChatOpen}
          hasNewMessages={hasNewMessages}
        />
      </div>

      <div className="flex flex-1 overflow-scroll">
        <AdaptiveVideoGrid remoteStreams={remoteStreams} />
        {isChatOpen && (
          <ChatPanel roomId={roomId} sendMessage={sendChatMessage} />
        )}
      </div>
    </div>
  );
}