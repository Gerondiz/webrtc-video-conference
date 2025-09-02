// src/app/room/[id]/page.tsx
'use client';
import { useEffect } from 'react';
import { useRoomConnection } from '@/hooks/useRoomConnection';
import { useRoomStore } from '@/stores/useRoomStore';
import { RoomHeader } from '@/components/RoomPage/RoomHeader';
import { VideoGrid } from '@/components/RoomPage/VideoGrid';
import { ConnectionStatus } from '@/components/RoomPage/ConnectionStatus';
import { InitializationOverlay } from '@/components/RoomPage/InitializationOverlay';
import Chat from '@/components/Chat';

export default function RoomPage() {
  const {
    roomId,
    username,
    initializeRoom,
    handleSendChatMessage,
    leaveRoom,
    retryConnection,
  } = useRoomConnection();
  
  const {
    isInitializing,
    connectionStatus,
    connectionError,
    toggleMic,
    toggleCamera,
    chatMessages,
  } = useRoomStore();

  // Инициализация комнаты при монтировании
  useEffect(() => {
    initializeRoom();
  }, [initializeRoom]);

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      <RoomHeader
        roomId={roomId}
        onLeave={leaveRoom}
        onToggleMic={toggleMic}
        onToggleCamera={toggleCamera}
      />
      <ConnectionStatus
        connectionError={connectionError}
        onRetry={retryConnection}
      />
      <div className="flex-1 flex overflow-hidden">
        <VideoGrid username={username} />
        <div className="w-80 border-l border-gray-700 flex flex-col">
          <Chat
            messages={chatMessages}
            onSendMessage={handleSendChatMessage}
            currentUser={username}
          />
        </div>
      </div>
      <InitializationOverlay
        isInitializing={isInitializing}
        connectionStatus={connectionStatus}
        onRetry={retryConnection}
      />
    </div>
  );
}