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
import { useActiveSpeakerDetection } from "@/hooks/useActiveSpeakerDetection";
import { useVideoLayoutStore } from "@/stores/useVideoLayoutStore";
import RoomHeader from "@/components/RoomPage/RoomHeader";
import MobileRoomHeader from "@/components/RoomPage/MobileRoomHeader";
import AdaptiveVideoGrid from "@/components/RoomPage/AdaptiveVideoGrid";
import ChatPanel from "@/components/RoomPage/ChatPanel";

export default function RoomPage() {
  const router = useRouter();
  const { stream: localStream, toggleAudio, toggleVideo } = useMediaStream();
  const { isChatOpen, hasNewMessages, toggleChat } = useChatPanel();

  const wsUrl =
    process.env.NEXT_PUBLIC_WS_URL ||
    "wss://backend-mediasoup.onrender.com/wss";
  const webSocket = useWebSocket(wsUrl);
  const { isConnected } = webSocket;

  // ✅ 1. Получаем данные из Zustand ДО использования
  const { currentUserId } = useRoomStore();
  const isSpeakerHighlightEnabled = useVideoLayoutStore(
    (state) => state.isSpeakerHighlightEnabled
  );

  // ✅ 2. Объявляем состояние потоков
  const [remoteStreams, setRemoteStreams] = useState<
    Array<{
      userId: string;
      username: string;
      stream: MediaStream;
    }>
  >([]);

  // ✅ 3. Теперь можно использовать хук
  const activeSpeakerId = useActiveSpeakerDetection(
    remoteStreams,
    localStream,
    currentUserId,
    isSpeakerHighlightEnabled
  );

  // ✅ 4. Подключаемся к комнате
  const { roomId, sendChatMessage, leaveRoom } = useRoomConnection({
    webSocket,
  });

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

  // Запускаем SFU после подключения
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

  // Очистка
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
        <AdaptiveVideoGrid
          remoteStreams={remoteStreams}
          activeSpeakerId={activeSpeakerId}
        />
        {isChatOpen && (
          <ChatPanel roomId={roomId} sendMessage={sendChatMessage} />
        )}
      </div>
    </div>
  );
}