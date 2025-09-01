import { useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useRoomStore } from '../stores/useRoomStore';
import {
  UserJoinedMessage,
  UserLeftMessage,
  WebRTCOfferMessage,
  WebRTCAnswerMessage,
  WebRTCIceCandidateMessage,
  ChatMessageData,
  ErrorMessage,
} from '@/types';

export const useRoomConnection = () => {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const roomId = params.id;
  const username = searchParams.get('username') || 'User';
  
  const {
    isConnected,
    isConnecting,
    sendMessage,
    addMessageHandler,
    removeMessageHandler,
    disconnect: disconnectWebSocket,
  } = useWebSocket(`ws://localhost:8000/ws`);
  
  const {
    initMedia,
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    sendDataMessage,
    cleanup: cleanupWebRTC,
  } = useWebRTC({
    onRemoteStream: (stream, userId) => {
      useRoomStore.getState().addRemoteStream({ 
        userId, 
        username: userId, 
        stream 
      });
    },
    onDataChannelMessage: (message, userId) => {
      try {
        const parsedMessage = JSON.parse(message);
        if (parsedMessage.type === 'chat') {
          useRoomStore.getState().addChatMessage({
            id: Date.now().toString(),
            from: userId,
            text: parsedMessage.text,
            timestamp: new Date(),
          });
        }
      } catch (error) {
        console.error('Error parsing data channel message:', error);
      }
    },
  });
  
  const {
    setConnectionStatus,
    setConnectionError,
    setLocalStream,
    addUser,
    removeUser,
    addChatMessage,
    setIsInitializing,
    setShowDeviceSelector,
    users,
  } = useRoomStore();
  
  // Обработчики сообщений WebSocket
  useEffect(() => {
    const handleUserJoined = ({ user }: UserJoinedMessage) => {
      console.log('User joined:', user);
      addUser(user);
      
      if (user !== username) {
        createOffer(user).then((offer) => {
          sendMessage({
            type: 'webrtc-offer',
            data: {
              target: user,
              payload: offer,
            },
          });
        }).catch((error) => {
          console.error('Error creating offer:', error);
          setConnectionError('Failed to create WebRTC offer');
        });
      }
    };
    
    const handleUserLeft = ({ user }: UserLeftMessage) => {
      console.log('User left:', user);
      removeUser(user);
      useRoomStore.getState().removeRemoteStream(user);
    };
    
    const handleWebRTCOffer = ({ from, payload }: WebRTCOfferMessage) => {
      console.log('Received offer from:', from);
      handleOffer(from, payload)
        .then((answer) => {
          sendMessage({
            type: 'webrtc-answer',
            data: {
              target: from,
              payload: answer,
            },
          });
        })
        .catch((error) => {
          console.error('Error handling offer:', error);
          setConnectionError('Failed to handle WebRTC offer');
        });
    };
    
    const handleWebRTCAnswer = ({ from, payload }: WebRTCAnswerMessage) => {
      console.log('Received answer from:', from);
      handleAnswer(from, payload).catch((error) => {
        console.error('Error handling answer:', error);
        setConnectionError('Failed to handle WebRTC answer');
      });
    };
    
    const handleWebRTCIceCandidate = ({ from, payload }: WebRTCIceCandidateMessage) => {
      console.log('Received ICE candidate from:', from);
      handleIceCandidate(from, payload).catch((error) => {
        console.error('Error handling ICE candidate:', error);
        setConnectionError('Failed to handle ICE candidate');
      });
    };
    
    const handleChatMessage = ({ from, text }: ChatMessageData) => {
      addChatMessage({
        id: Date.now().toString(),
        from,
        text,
        timestamp: new Date(),
      });
    };
    
    const handleError = ({ message }: ErrorMessage) => {
      console.error('Server error:', message);
      setConnectionError(message);
    };
    
    addMessageHandler<UserJoinedMessage>('user-joined', handleUserJoined);
    addMessageHandler<UserLeftMessage>('user-left', handleUserLeft);
    addMessageHandler<WebRTCOfferMessage>('webrtc-offer', handleWebRTCOffer);
    addMessageHandler<WebRTCAnswerMessage>('webrtc-answer', handleWebRTCAnswer);
    addMessageHandler<WebRTCIceCandidateMessage>('webrtc-ice-candidate', handleWebRTCIceCandidate);
    addMessageHandler<ChatMessageData>('chat-message', handleChatMessage);
    addMessageHandler<ErrorMessage>('error', handleError);
    
    return () => {
      removeMessageHandler('user-joined');
      removeMessageHandler('user-left');
      removeMessageHandler('webrtc-offer');
      removeMessageHandler('webrtc-answer');
      removeMessageHandler('webrtc-ice-candidate');
      removeMessageHandler('chat-message');
      removeMessageHandler('error');
    };
  }, [
    username,
    sendMessage,
    addMessageHandler,
    removeMessageHandler,
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    addUser,
    removeUser,
    addChatMessage,
    setConnectionError,
  ]);
  
  // Инициализация медиа и подключение к комнате
  const initializeRoom = useCallback(async () => {
    try {
      setIsInitializing(true);
      setConnectionStatus('initializing-media');
      setConnectionError(null);
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasDevices = devices.some(
        (device) =>
          (device.kind === 'audioinput' || device.kind === 'videoinput') &&
          device.deviceId !== ''
      );
      
      if (!hasDevices) {
        setShowDeviceSelector(true);
        setConnectionStatus('need-devices');
        setIsInitializing(false);
        return;
      }
      
      setConnectionStatus('requesting-permission');
      const stream = await initMedia();
      setLocalStream(stream);
      
      setConnectionStatus('waiting-websocket');
      
      if (isConnected) {
        setConnectionStatus('joining-room');
        sendMessage({
          type: 'join-room',
          data: {
            roomId,
            username,
          },
        });
        setConnectionStatus('connected');
      }
    } catch (error: unknown) {
      console.error('Error initializing:', error);
      setConnectionStatus('error');
      const typedError = error as { code: number; message: string; name: string };
      setConnectionError(typedError.message);
      
      if (typedError.name === 'NotAllowedError') {
        setShowDeviceSelector(true);
      }
    } finally {
      setIsInitializing(false);
    }
  }, [
    roomId,
    username,
    initMedia,
    isConnected,
    sendMessage,
    setConnectionStatus,
    setConnectionError,
    setLocalStream,
    setIsInitializing,
    setShowDeviceSelector,
  ]);
  
  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      cleanupWebRTC();
      disconnectWebSocket();
      useRoomStore.getState().reset();
    };
  }, [cleanupWebRTC, disconnectWebSocket]);
  
  // Отслеживаем изменения состояния WebSocket соединения
  useEffect(() => {
    if (isConnected && useRoomStore.getState().localStream && !useRoomStore.getState().isInitializing) {
      setConnectionStatus('joining-room');
      sendMessage({
        type: 'join-room',
        data: {
          roomId,
          username,
        },
      });
      setConnectionStatus('connected');
    }
  }, [isConnected, roomId, username, sendMessage, setConnectionStatus]);
  
  const handleSendChatMessage = useCallback(
    (text: string) => {
      users.forEach((user) => {
        if (user !== username) {
          sendDataMessage(user, JSON.stringify({ type: 'chat', text }));
        }
      });
      
      sendMessage({
        type: 'chat-message',
        data: { text },
      });
      
      addChatMessage({
        id: Date.now().toString(),
        from: username,
        text,
        timestamp: new Date(),
      });
    },
    [users, username, sendDataMessage, sendMessage, addChatMessage]
  );
  
  const handleDevicesSelected = useCallback(
    async ({ video, audio }: { video: string; audio: string }) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: video ? { deviceId: { exact: video } } : true,
          audio: audio ? { deviceId: { exact: audio } } : true,
        });
        
        const currentLocalStream = useRoomStore.getState().localStream;
        if (currentLocalStream) {
          currentLocalStream.getTracks().forEach((track) => track.stop());
        }
        
        setLocalStream(stream);
        setShowDeviceSelector(false);
        setConnectionStatus('connected');
        
        if (isConnected) {
          sendMessage({
            type: 'join-room',
            data: {
              roomId,
              username,
            },
          });
        }
      } catch (error: unknown) {
        console.error('Error accessing devices:', error);
        setConnectionError('Failed to access selected devices');
      }
    },
    [isConnected, roomId, username, sendMessage, setLocalStream, setShowDeviceSelector, setConnectionStatus, setConnectionError]
  );
  
  const handleDeviceSelectorCancel = useCallback(() => {
    setShowDeviceSelector(false);
    if (!useRoomStore.getState().localStream) {
      window.location.href = '/';
    }
  }, [setShowDeviceSelector]);
  
  const leaveRoom = useCallback(() => {
    cleanupWebRTC();
    disconnectWebSocket();
    window.location.href = '/';
  }, [cleanupWebRTC, disconnectWebSocket]);
  
  const retryConnection = useCallback(() => {
    setConnectionError(null);
    setConnectionStatus('connecting');
    initializeRoom();
  }, [setConnectionError, setConnectionStatus, initializeRoom]);
  
  return {
    roomId,
    username,
    initializeRoom,
    handleSendChatMessage,
    handleDevicesSelected,
    handleDeviceSelectorCancel,
    leaveRoom,
    retryConnection,
  };
};