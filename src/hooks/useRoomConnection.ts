// src/hooks/useRoomConnection.ts
import { useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useMediaStream } from '@/contexts/MediaStreamContext';
import { WebSocketMessage } from '@/types';

export const useRoomConnection = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.id as string;
  const username = searchParams.get('username') || 'Anonymous';
  
  const { stream: localStream, stopMediaStream } = useMediaStream();
  const {
    isConnected,
    isConnecting,
    sendMessage,
    addMessageHandler,
    removeMessageHandler,
    disconnect: disconnectWebSocket,
  } = useWebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000');

  // Инициализация медиапотока при входе в комнату
  // useEffect(() => {
  //   const initializeMedia = async () => {
  //     try {
  //       await initMedia();
  //     } catch (error) {
  //       console.error('Failed to initialize media:', error);
  //     }
  //   };

  //   initializeMedia();
  // }, [initMedia]);

  // Отправка сообщения о присоединении к комнате
  useEffect(() => {
    if (isConnected) {
      sendMessage({
        type: 'join-room',
        roomId,
        username,
      });
    }
  }, [isConnected, localStream, roomId, username, sendMessage]);

  // Обработчик для входящих сообщений
  useEffect(() => {
    const handleUserJoined = (message: WebSocketMessage) => {
      console.log('User joined:', message.user);
    };

    const handleUserLeft = (message: WebSocketMessage) => {
      console.log('User left:', message.user);
    };

    addMessageHandler('user-joined', handleUserJoined);
    addMessageHandler('user-left', handleUserLeft);

    return () => {
      removeMessageHandler('user-joined', handleUserJoined);
      removeMessageHandler('user-left', handleUserLeft);
    };
  }, [addMessageHandler, removeMessageHandler]);

  // Функция для отправки сообщений чата
  const sendChatMessage = useCallback((text: string) => {
    sendMessage({
      type: 'chat-message',
      roomId,
      username,
      text,
      timestamp: new Date().toISOString(),
    });
  }, [roomId, username, sendMessage]);

  // Функция для выхода из комнаты
  const leaveRoom = useCallback(() => {
    sendMessage({
      type: 'user-left',
      roomId,
      username,
    });
    stopMediaStream();
    disconnectWebSocket();
  }, [roomId, username, sendMessage, stopMediaStream, disconnectWebSocket]);

  return {
    roomId,
    username,
    isConnected,
    isConnecting,
    sendChatMessage,
    leaveRoom,
  };
};