// src/hooks/useRoomConnection.ts
import { useEffect, useCallback, useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { UseWebSocketReturn } from '@/hooks/useWebSocket';
import { useMediaStream } from '@/contexts/MediaStreamContext';
import { useRoomStore } from '@/stores/useRoomStore';
import { useChatStore } from '@/stores/useChatStore';
import {
  JoinRoomMessage,
  LeaveRoomMessage,
  ChatMessageData,
  ChatHistoryMessage,
  GetChatHistoryMessage,
  UserJoinedMessage,
  UserConnectionStatusMessage,
  UserLeftMessage,
  JoinedMessage,
  UsersUpdatedMessage,
  ErrorMessage,
} from '@/types';

export const useRoomConnection = ({ webSocket }: { webSocket: UseWebSocketReturn }) => {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.id as string;
  const username = searchParams.get('username') || 'Anonymous';

  const sessionId = useMemo(() => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const { initMedia, stopMediaStream } = useMediaStream();

  const {
    isConnected,
    isConnecting,
    sendMessage,
    addMessageHandler,
    removeMessageHandler,
    disconnect: disconnectWebSocket,
  } = webSocket;

  const {
    setWsConnected,
    setWsConnecting,
    setUsers,
    addUser,
    removeUser,
    updateUserConnectionStatus,
  } = useRoomStore();

  const [hasMediaInitialized, setHasMediaInitialized] = useState(false);
  const { addMessage: addChatMessage, setMessages: setChatMessages } = useChatStore();

  // Синхронизация состояния WebSocket
  useEffect(() => {
    setWsConnected(isConnected);
    setWsConnecting(isConnecting);
  }, [isConnected, isConnecting, setWsConnected, setWsConnecting]);

  // Инициализация медиапотока
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

  // Обработчики сообщений
  useEffect(() => {
    const handleUserJoined = (message: UserJoinedMessage) => {
      console.log('User joined:', message.data.user);
      addUser(message.data.user);
    };

    const handleUserLeft = (message: UserLeftMessage) => {
      console.log('User left:', message.data.user);
      const userIdToRemove = message.data.userId || message.data.user.id;
      removeUser(userIdToRemove);
    };

    const handleJoined = (message: JoinedMessage) => {
      console.log('✅ Joined room, rtpCapabilities:', message.data.rtpCapabilities);
      console.log('Joined room successfully:', message.data.users);

      const serverSessionId = message.data.sessionId;
      const me = message.data.users.find(u => u.sessionId === serverSessionId);
      if (me) {
        useRoomStore.getState().setCurrentUserId(me.id);
        console.log('✅ User ID set:', me.id);
      } else {
        console.warn('⚠️ User not found in users list by sessionId:', serverSessionId);
      }

      const users = message.data.users.map(user => ({
        ...user,
        isConnected: user.isConnected !== undefined ? user.isConnected : true,
        sessionId: user.sessionId || ''
      }));

      setUsers(users);

      // ✅ Правильное преобразование истории чата
      // console.log('setChatMessages_1', message)
      // if (message.data.chatHistory) {
      //   console.log('setChatMessages_2', message.data)
      //   setChatMessages(message.data.chatHistory.map(msg => ({
      //     id: msg.data.timestamp,
      //     from: msg.data.from,
      //     text: msg.data.text,
      //     timestamp: new Date(msg.data.timestamp)
      //   })));
      // }

      if (message.data.sessionId) {
        sessionStorage.setItem(`session_${roomId}`, message.data.sessionId);
      }
    };

    const handleUserConnectionStatus = (message: UserConnectionStatusMessage) => {
      console.log('User connection status:', message.data.userId, message.data.isConnected);
      updateUserConnectionStatus(message.data.userId, message.data.isConnected);
    };

    const handleUsersUpdated = (message: UsersUpdatedMessage) => {
      console.log('Users list updated:', message.data.users);
      setUsers(message.data.users);
    };

    const handleChatMessage = (message: ChatMessageData) => {
      console.log('Received chat message:', message.data);
      console.log('Message:', message);
      addChatMessage({
        id: message.data.timestamp, // ✅ Используем timestamp как ID
        from: message.data.from,
        text: message.data.text,
        timestamp: new Date(message.data.timestamp) // ✅ Преобразуем строку в Date
      });
    };

    const handleChatHistory = (message: ChatHistoryMessage) => {
      console.log('Received chat data:', message);
      console.log('Received chat history:', message.data);
      setChatMessages(message.data.map(msg => ({
        id: msg.id,
        from: msg.from,
        text: msg.text,
        timestamp: new Date(msg.timestamp)
      })));
    };

    const handleError = (message: ErrorMessage) => {
      console.error('Server error:', message.data.message);
    };

    addMessageHandler('user-joined', handleUserJoined as (message: UserJoinedMessage) => void);
    addMessageHandler('user-left', handleUserLeft as (message: UserLeftMessage) => void);
    addMessageHandler('joined', handleJoined as (message: JoinedMessage) => void);
    addMessageHandler('user-connection-status', handleUserConnectionStatus as (message: UserConnectionStatusMessage) => void);
    addMessageHandler('users-updated', handleUsersUpdated as (message: UsersUpdatedMessage) => void);
    addMessageHandler('chat-message', handleChatMessage as (message: ChatMessageData) => void);
    addMessageHandler('chat-history', handleChatHistory as (message: ChatHistoryMessage) => void);
    addMessageHandler('error', handleError as (message: ErrorMessage) => void);

    return () => {
      removeMessageHandler('user-joined', handleUserJoined as (message: UserJoinedMessage) => void);
      removeMessageHandler('user-left', handleUserLeft as (message: UserLeftMessage) => void);
      removeMessageHandler('joined', handleJoined as (message: JoinedMessage) => void);
      removeMessageHandler('user-connection-status', handleUserConnectionStatus as (message: UserConnectionStatusMessage) => void);
      removeMessageHandler('users-updated', handleUsersUpdated as (message: UsersUpdatedMessage) => void);
      removeMessageHandler('chat-message', handleChatMessage as (message: ChatMessageData) => void);
      removeMessageHandler('chat-history', handleChatHistory as (message: ChatHistoryMessage) => void);
      removeMessageHandler('error', handleError as (message: ErrorMessage) => void);
    };
  }, [addMessageHandler, removeMessageHandler, addUser, removeUser, setUsers, updateUserConnectionStatus, roomId, addChatMessage, setChatMessages]);

  // Отправка сообщения серверу о присоединении к комнате
  useEffect(() => {
    if (isConnected && hasMediaInitialized) {
      const joinMessage: JoinRoomMessage = {
        type: 'join-room',
        data: {
          roomId,
          username,
          sessionId,
        },
      };

      sendMessage(joinMessage);

      // ✅ Запрашиваем историю чата после присоединения
      setTimeout(() => {
        const historyMessage: GetChatHistoryMessage = { // ✅ Указываем правильный тип
          type: 'get-chat-history',
          data: {}, // ✅ Пустой объект
        };
        sendMessage(historyMessage);
      }, 100);

      sessionStorage.setItem('username', username);
    }
  }, [isConnected, roomId, username, sendMessage, hasMediaInitialized, sessionId]);

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
        sessionId,
      },
    };

    sendMessage(leaveMessage);
    stopMediaStream();
    disconnectWebSocket();
    useRoomStore.getState().reset();
    useChatStore.getState().clearMessages();

    sessionStorage.removeItem(`session_${roomId}`);
  }, [roomId, username, sendMessage, stopMediaStream, disconnectWebSocket, sessionId]);

  return {
    roomId,
    username,
    isConnected,
    isConnecting,
    sendMessage,
    sendChatMessage,
    leaveRoom,
    addMessageHandler,
    removeMessageHandler,
  };
};