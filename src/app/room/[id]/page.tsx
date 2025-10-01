// app/room/[id]/page.tsx
"use client";
import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMediaStream } from "@/contexts/MediaStreamContext";
import { useRoomConnection } from "@/hooks/useRoomConnection";
import { useMediasoup } from "@/hooks/useMediasoup";
import { useRoomStore } from "@/stores/useRoomStore";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useChatPanel } from "@/hooks/useChatPanel";
import { getWebSocketUrl } from "@/lib/tunnel-url"; // ✅ Импортируем хелпер
import RoomHeader from "@/components/RoomPage/RoomHeader";
import MobileRoomHeader from "@/components/RoomPage/MobileRoomHeader";
import AdaptiveVideoGrid from '@/components/RoomPage/AdaptiveVideoGrid';
import ChatPanel from "@/components/RoomPage/ChatPanel";

export default function RoomPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const usernameFromParams = searchParams.get('username') || '';
  const { stream: localStream } = useMediaStream();
  const { isChatOpen, hasNewMessages, toggleChat } = useChatPanel();

  // ✅ Состояние для URL WebSocket
  const [wsUrl, setWsUrl] = useState<string | null>(null);

  // ✅ Загружаем WebSocket URL асинхронно
  useEffect(() => {
    const fetchWsUrl = async () => {
      const url = await getWebSocketUrl(process.env.NEXT_PUBLIC_WS_URL || 'wss://backend-mediasoup.onrender.com/wss');
      setWsUrl(url);
    };
    fetchWsUrl();
  }, []);

  // ✅ Вызываем все хуки **до** любой проверки условий
  // Если wsUrl === null, useWebSocket может обработать это (например, не подключаться)
  // или можно передать пустую строку, если хук устроен так.
  // ВАЖНО: useWebSocket должен быть устроен так, чтобы не падать при пустом URL.
  const webSocket = useWebSocket(wsUrl || ''); // ✅ Передаём пустую строку, если wsUrl ещё нет
  const { isConnected } = webSocket;

  // ✅ Остальные хуки вызываются всегда
  const { roomId, sendChatMessage, leaveRoom } = useRoomConnection({
    webSocket,
  });

  const { currentUserId } = useRoomStore();

  // ✅ Устанавливаем username из параметров URL в store (если ещё не установлен)
  useEffect(() => {
    if (usernameFromParams && !currentUserId) {
      // Предположим, у тебя есть action в store для установки username и генерации ID
      // useRoomStore.getState().setUsernameAndGenerateId(usernameFromParams);
      // Или вызови action, если он есть
    }
  }, [usernameFromParams, currentUserId]);

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

  // ✅ Рендерим лоадер, если wsUrl ещё не загружен
  if (!wsUrl) {
    return <div>Loading...</div>; // Показываем лоадер, пока URL не загрузился
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Десктопный заголовок */}
      <div className="hidden md:block">
        <RoomHeader
          roomId={roomId}
          onToggleMic={toggleMic}
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
          onToggleMic={toggleMic}
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