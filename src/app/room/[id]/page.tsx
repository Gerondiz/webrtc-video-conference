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
import VideoGrid from "@/components/RoomPage/VideoGrid";
import ChatPanel from "@/components/RoomPage/ChatPanel";

export default function RoomPage() {
  const router = useRouter();
  const { stream: localStream } = useMediaStream();
  const { isChatOpen, hasNewMessages, toggleChat } = useChatPanel();

  const webSocket = useWebSocket(
    process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001"
  );
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
      // ✅ Здесь теперь будет правильное имя пользователя
      console.log(`🎥 Remote stream added for user ${userId} (${username})`);
      setRemoteStreams((prev) => [...prev, { userId, username, stream }]);
    },
    onRemoteStreamRemoved: (userId) => {
      console.log(`🎥 Remote stream removed for user ${userId}`);
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
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      <RoomHeader
        roomId={roomId}
        onToggleMic={toggleMic}
        onToggleVideo={toggleVideo}
        onLeaveRoom={handleLeaveRoom}
        onSettings={openSettings}
        onToggleChat={toggleChat}
        isChatOpen={isChatOpen}
        hasNewMessages={hasNewMessages}
      />

      <div className="flex flex-1 overflow-hidden">
        <VideoGrid remoteStreams={remoteStreams} />
        {isChatOpen && (
          <ChatPanel roomId={roomId} sendMessage={sendChatMessage} />
        )}
      </div>
    </div>
  );
}