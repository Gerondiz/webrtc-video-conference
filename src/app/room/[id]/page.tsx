'use client';

import { useEffect } from 'react';
import { useRoomConnection } from '@/hooks/useRoomConnection';
import { useRoomStore } from '@/stores/useRoomStore';
import { RoomHeader } from '@/components/RoomHeader';
import { VideoGrid } from '@/components/VideoGrid';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { DeviceSelector } from '@/components/DeviceSelector';
import { InitializationOverlay } from '@/components/InitializationOverlay';
import Chat from '@/components/Chat';

export default function RoomPage() {
  const {
    roomId,
    username,
    initializeRoom,
    handleSendChatMessage,
    handleDevicesSelected,
    handleDeviceSelectorCancel,
    leaveRoom,
    retryConnection,
  } = useRoomConnection();
  
  const {
    showDeviceSelector,
    isInitializing,
    connectionStatus,
    connectionError,
    toggleMic,
    toggleCamera,
    setShowDeviceSelector,
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
        onShowDeviceSelector={() => setShowDeviceSelector(true)}
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
      
      {showDeviceSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <DeviceSelector
              onDevicesSelected={handleDevicesSelected}
              onCancel={handleDeviceSelectorCancel}
            />
          </div>
        </div>
      )}
      
      <InitializationOverlay
        isInitializing={isInitializing}
        connectionStatus={connectionStatus}
        onRetry={retryConnection}
        onShowDeviceSelector={() => setShowDeviceSelector(true)}
      />
    </div>
  );
}