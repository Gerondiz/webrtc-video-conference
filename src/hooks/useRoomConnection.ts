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
  MicStatusChangedMessage,
} from '@/types';

export const useRoomConnection = ({ webSocket }: { webSocket: UseWebSocketReturn }) => {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.id as string;
  const username = searchParams.get('username') || 'Anonymous';

  const sessionId = useMemo(() => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const { initMedia, stopMediaStream, isAudioEnabled } = useMediaStream();

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
    updateUserMicStatus,
    currentUserId,
  } = useRoomStore();

  const [hasMediaInitialized, setHasMediaInitialized] = useState(false);
  const { addMessage: addChatMessage, setMessages: setChatMessages } = useChatStore();

  // Sync WebSocket connection state
  useEffect(() => {
    setWsConnected(isConnected);
    setWsConnecting(isConnecting);
  }, [isConnected, isConnecting, setWsConnected, setWsConnecting]);

  // Initialize media
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

  // 🔊 Send mic status on change
  useEffect(() => {
    if (isConnected && currentUserId && hasMediaInitialized) {
      const micStatusMessage: MicStatusChangedMessage = {
        type: 'mic-status-changed',
        data: {
          userId: currentUserId,
          isMuted: !isAudioEnabled,
        },
      };
      sendMessage(micStatusMessage);
    }
  }, [isAudioEnabled, isConnected, currentUserId, hasMediaInitialized, sendMessage]);

  // Message handlers
  useEffect(() => {
    const handleUserJoined = (message: UserJoinedMessage) => {
      addUser(message.data.user);
    };

    const handleUserLeft = (message: UserLeftMessage) => {
      const userIdToRemove = message.data.userId;
      if (userIdToRemove) {
        removeUser(userIdToRemove);
      }
    };

    const handleJoined = (message: JoinedMessage) => {
      const serverSessionId = message.data.sessionId;
      const me = message.data.users.find(u => u.sessionId === serverSessionId);
      if (me) {
        useRoomStore.getState().setCurrentUserId(me.id);
      }
      const users = message.data.users.map(user => ({
        ...user,
        isConnected: user.isConnected !== undefined ? user.isConnected : true,
        sessionId: user.sessionId || '',
      }));
      setUsers(users);
      if (message.data.sessionId) {
        sessionStorage.setItem(`session_${roomId}`, message.data.sessionId);
      }
    };

    const handleUserConnectionStatus = (message: UserConnectionStatusMessage) => {
      updateUserConnectionStatus(message.data.userId, message.data.isConnected);
    };

    const handleUsersUpdated = (message: UsersUpdatedMessage) => {
      setUsers(message.data.users);
    };

    const handleChatMessage = (message: ChatMessageData) => {
      const isOwnMessage = message.data.from === username;
      const displayName = isOwnMessage ? 'You' : message.data.from;
      addChatMessage({
        id: message.data.timestamp,
        from: displayName,
        text: message.data.text,
        timestamp: new Date(message.data.timestamp),
      });
    };

    const handleChatHistory = (message: ChatHistoryMessage) => {
      const processedMessages = message.data.map(msg => {
        const isOwnMessage = msg.from === username;
        const displayName = isOwnMessage ? 'You' : msg.from;
        return {
          id: msg.id,
          from: displayName,
          text: msg.text,
          timestamp: new Date(msg.timestamp),
        };
      });
      setChatMessages(processedMessages);
    };

    const handleError = (message: ErrorMessage) => {
      console.error('Server error:', message.data.message);
    };

    const handleMicStatusChanged = (message: MicStatusChangedMessage) => {
      updateUserMicStatus(message.data.userId, message.data.isMuted);
    };

    // Register handlers with correct typing
    addMessageHandler<UserJoinedMessage>('user-joined', handleUserJoined);
    addMessageHandler<UserLeftMessage>('user-left', handleUserLeft);
    addMessageHandler<JoinedMessage>('joined', handleJoined);
    addMessageHandler<UserConnectionStatusMessage>('user-connection-status', handleUserConnectionStatus);
    addMessageHandler<UsersUpdatedMessage>('users-updated', handleUsersUpdated);
    addMessageHandler<ChatMessageData>('chat-message', handleChatMessage);
    addMessageHandler<ChatHistoryMessage>('chat-history', handleChatHistory);
    addMessageHandler<ErrorMessage>('error', handleError);
    addMessageHandler<MicStatusChangedMessage>('mic-status-changed', handleMicStatusChanged);

    return () => {
      removeMessageHandler<UserJoinedMessage>('user-joined', handleUserJoined);
      removeMessageHandler<UserLeftMessage>('user-left', handleUserLeft);
      removeMessageHandler<JoinedMessage>('joined', handleJoined);
      removeMessageHandler<UserConnectionStatusMessage>('user-connection-status', handleUserConnectionStatus);
      removeMessageHandler<UsersUpdatedMessage>('users-updated', handleUsersUpdated);
      removeMessageHandler<ChatMessageData>('chat-message', handleChatMessage);
      removeMessageHandler<ChatHistoryMessage>('chat-history', handleChatHistory);
      removeMessageHandler<ErrorMessage>('error', handleError);
      removeMessageHandler<MicStatusChangedMessage>('mic-status-changed', handleMicStatusChanged);
    };
  }, [
    addMessageHandler,
    removeMessageHandler,
    addUser,
    removeUser,
    setUsers,
    updateUserConnectionStatus,
    updateUserMicStatus,
    roomId,
    addChatMessage,
    setChatMessages,
    username,
  ]);

  // Join room
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

      setTimeout(() => {
        const historyMessage: GetChatHistoryMessage = {
          type: 'get-chat-history',
          data: {},
        };
        sendMessage(historyMessage);
      }, 100);

      sessionStorage.setItem('username', username);
    }
  }, [isConnected, roomId, username, sendMessage, hasMediaInitialized, sessionId]);

  const sendChatMessage = useCallback(
    (text: string) => {
      const chatMessage: ChatMessageData = {
        type: 'chat-message',
        data: {
          from: username,
          text,
          timestamp: new Date().toISOString(),
        },
      };
      sendMessage(chatMessage);
    },
    [username, sendMessage]
  );

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