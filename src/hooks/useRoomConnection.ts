// src/hooks/useRoomConnection.ts
import { useEffect, useCallback, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useMediaStream } from '@/contexts/MediaStreamContext';
import { useRoomStore } from '@/stores/useRoomStore';
import {
  JoinRoomMessage,
  LeaveRoomMessage,
  ChatMessageData,
  UserJoinedMessage,
  UserLeftMessage,
  JoinedMessage,
  ErrorMessage,
} from '@/types';

export const useRoomConnection = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.id as string;
  const username = searchParams.get('username') || 'Anonymous';
  
  const { initMedia, stopMediaStream } = useMediaStream();
  
  // Получаем состояние WebSocket
  const {
    isConnected,
    isConnecting,
    sendMessage,
    addMessageHandler,
    removeMessageHandler,
    disconnect: disconnectWebSocket,
  } = useWebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000');

  // Получаем Zustand store
  const {
    setWsConnected,
    setWsConnecting,
    setUsers,
    addUser,
    removeUser,
  } = useRoomStore();

  const [hasMediaInitialized, setHasMediaInitialized] = useState(false);
  const joinSentRef = useRef(false);

  // Синхронизация состояния WebSocket с хранилищем
  useEffect(() => {
    setWsConnected(isConnected);
    setWsConnecting(isConnecting);
  }, [isConnected, isConnecting, setWsConnected, setWsConnecting]);

  // Инициализация медиапотока при входе в комнату
  useEffect(() => {
    if (!hasMediaInitialized) {
      const initializeMedia = async () => {
        try {
          await initMedia();
          setHasMediaInitialized(true);
        } catch (error) {
          console.error('Failed to initialize media:', error);
          setHasMediaInitialized(true);
        }
      };

      initializeMedia();
    }
  }, [initMedia, hasMediaInitialized]);

  // Обработчик для входящих сообщений
  useEffect(() => {
    const handleUserJoined = (message: UserJoinedMessage) => {
      console.log('User joined:', message.data.user);
      addUser(message.data.user);
    };

    const handleUserLeft = (message: UserLeftMessage) => {
      console.log('User left:', message.data.user);
      removeUser(message.data.user);
    };

    const handleJoined = (message: JoinedMessage) => {
      console.log('Joined room successfully:', message.data.users);
      setUsers(message.data.users || []);
    };

    const handleError = (message: ErrorMessage) => {
      console.error('Server error:', message.data.message);
    };

    addMessageHandler<UserJoinedMessage>('user-joined', handleUserJoined);
    addMessageHandler<UserLeftMessage>('user-left', handleUserLeft);
    addMessageHandler<JoinedMessage>('joined', handleJoined);
    addMessageHandler<ErrorMessage>('error', handleError);

    return () => {
      removeMessageHandler('user-joined', handleUserJoined);
      removeMessageHandler('user-left', handleUserLeft);
      removeMessageHandler('joined', handleJoined);
      removeMessageHandler('error', handleError);
    };
  }, [addMessageHandler, removeMessageHandler, addUser, removeUser, setUsers]);

  // Отправка сообщения о присоединении к комнате
  useEffect(() => {
    if (isConnected && !joinSentRef.current) {
      const joinMessage: JoinRoomMessage = {
        type: 'join-room',
        data: {
          roomId,
          username,
        },
      };
      
      sendMessage(joinMessage);
      joinSentRef.current = true;
    }
  }, [isConnected, roomId, username, sendMessage]);

  // Функция для отправки сообщений чата
  const sendChatMessage = useCallback((text: string) => {
    const chatMessage: ChatMessageData = {
      type: 'chat-message',
      data: {
        from: username,
        text,
        timestamp: new Date().toISOString(),
      },
    };
    
    sendMessage(chatMessage);
  }, [username, sendMessage]);

  // Функция для выхода из комнаты
  const leaveRoom = useCallback(() => {
    const leaveMessage: LeaveRoomMessage = {
      type: 'leave-room',
      data: {
        roomId,
        username,
      },
    };
    
    sendMessage(leaveMessage);
    stopMediaStream();
    disconnectWebSocket();
    useRoomStore.getState().reset();
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