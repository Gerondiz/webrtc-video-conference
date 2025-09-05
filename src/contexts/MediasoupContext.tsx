// contexts/MediasoupContext.tsx
'use client';
import React, { createContext, useContext, useState, ReactNode, useCallback, useRef } from 'react';
import * as mediasoupClient from 'mediasoup-client';
import {
  RoomResponse,
  WebSocketMessage,
  MediasoupTransportCreatedMessage,
  MediasoupNewProducerMessage,
  MediasoupProducerClosedMessage,
  MediasoupConsumeMessage,
  RemoteStream,
  User,
  ChatMessage,
  JoinedMessage,
  ErrorMessage,
  UserJoinedMessage,
  UserLeftMessage,
  ExtendedWebSocketMessage,
  TransportConnectedMessage,
  ProducedMessage,
  ProducersListMessage
} from '@/types';
import {
  IceParameters,
  IceCandidate,
  DtlsParameters,
  TransportOptions,
  ProducerOptions,
  ConsumerOptions
} from '@/types/mediasoup';

interface MediasoupContextType {
  isConnected: boolean;
  isConnecting: boolean;
  roomId: string | null;
  userId: string | null;
  users: User[];
  remoteStreams: RemoteStream[];
  localStream: MediaStream | null;
  error: string | null;
  chatMessages: ChatMessage[];
  sendTransport: mediasoupClient.types.Transport | null;
  recvTransport: mediasoupClient.types.Transport | null;

  connect: (signalingUrl: string, roomId: string, username: string) => Promise<void>;
  disconnect: () => void;
  publishStream: (stream: MediaStream) => Promise<void>;
  unpublishStream: () => void;
  sendChatMessage: (text: string) => void;
}

const MediasoupContext = createContext<MediasoupContextType | undefined>(undefined);

// Вспомогательные функции
const generateId = (): string => Math.random().toString(36).substring(2, 15);

export const MediasoupProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState({
    isConnected: false,
    isConnecting: false,
    roomId: null as string | null,
    userId: null as string | null,
    users: [] as User[],
    remoteStreams: [] as RemoteStream[],
    localStream: null as MediaStream | null,
    error: null as string | null,
    chatMessages: [] as ChatMessage[],
    sendTransport: null as mediasoupClient.types.Transport | null,
    recvTransport: null as mediasoupClient.types.Transport | null
  });

  const deviceRef = useRef<mediasoupClient.Device | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const producersRef = useRef<Map<string, mediasoupClient.types.Producer>>(new Map());
  const consumersRef = useRef<Map<string, mediasoupClient.types.Consumer>>(new Map());

  const connect = useCallback(async (signalingUrl: string, roomId: string, username: string) => {
    if (state.isConnecting || state.isConnected) return;

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const userId = `user_${generateId()}`;
      const wsUrl = signalingUrl.replace('http', 'ws');
      const socket = new WebSocket(`${wsUrl}?roomId=${roomId}&userId=${userId}&username=${username}`);
      socketRef.current = socket;
      deviceRef.current = new mediasoupClient.Device();

      socket.onmessage = (event) => {
        try {
          const message: ExtendedWebSocketMessage = JSON.parse(event.data);
          handleServerMessage(message);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      socket.onopen = async () => {
        try {
          const response = await fetch(`${signalingUrl}/router-capabilities?roomId=${roomId}`);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const routerRtpCapabilities = await response.json();
          await deviceRef.current!.load({ routerRtpCapabilities });

          const joinMessage: WebSocketMessage = {
            type: 'join-room',
            data: { roomId, username }
          };
          socket.send(JSON.stringify(joinMessage));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Connection failed';
          setState(prev => ({ ...prev, error: errorMessage, isConnecting: false }));
        }
      };

      socket.onerror = () => {
        setState(prev => ({ ...prev, error: 'WebSocket error', isConnecting: false }));
      };

      socket.onclose = () => {
        setState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          roomId: null,
          userId: null,
          localStream: null
        }));
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      setState(prev => ({ ...prev, error: errorMessage, isConnecting: false }));
    }
  }, [state.isConnecting, state.isConnected]);

  const handleServerMessage = useCallback((message: ExtendedWebSocketMessage) => {
    switch (message.type) {
      case 'joined':
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          roomId: message.data.roomId,
          users: message.data.users || []
        }));
        createTransports();
        break;
      case 'webRtcTransportCreated':
        handleTransportCreated(message.data);
        break;
      // Остальные обработчики...
    }
  }, []);

  const createTransports = useCallback(async () => {
    if (!socketRef.current) return;

    const sendMsg = { type: 'create-transport', data: { direction: 'send' } };
    const recvMsg = { type: 'create-transport', data: { direction: 'recv' } };
    
    socketRef.current.send(JSON.stringify(sendMsg));
    socketRef.current.send(JSON.stringify(recvMsg));
  }, []);

  const handleTransportCreated = useCallback(async (data: MediasoupTransportCreatedMessage['data']) => {
    if (!deviceRef.current || !socketRef.current) return;

    try {
      const iceResponse = await fetch(`${window.location.origin}/ice-servers`);
      const iceServers = await iceResponse.json();

      const transportOptions: TransportOptions = {
        id: data.transportId,
        iceParameters: data.iceParameters,
        iceCandidates: data.iceCandidates,
        dtlsParameters: data.dtlsParameters,
        iceServers
      };

      let transport: mediasoupClient.types.Transport;
      if (data.direction === 'send') {
        transport = deviceRef.current.createSendTransport(transportOptions);
        setState(prev => ({ ...prev, sendTransport: transport }));
      } else {
        transport = deviceRef.current.createRecvTransport(transportOptions);
        setState(prev => ({ ...prev, recvTransport: transport }));
      }

      transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          const connectMsg = {
            type: 'connect-transport',
            data: { transportId: transport.id, dtlsParameters }
          };
          socketRef.current!.send(JSON.stringify(connectMsg));
          callback();
        } catch (error) {
          errback(error instanceof Error ? error : new Error('Transport connect failed'));
        }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transport creation failed';
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  }, []);

  const publishStream = useCallback(async (stream: MediaStream) => {
    if (!state.sendTransport) return;

    setState(prev => ({ ...prev, localStream: stream }));

    try {
      for (const track of stream.getTracks()) {
        const producer = await state.sendTransport!.produce({ track });
        producersRef.current.set(producer.id, producer);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to publish stream';
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  }, [state.sendTransport]);

  const unpublishStream = useCallback(() => {
    producersRef.current.forEach(producer => producer.close());
    producersRef.current.clear();
    setState(prev => ({ ...prev, localStream: null }));
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    producersRef.current.forEach(producer => producer.close());
    consumersRef.current.forEach(consumer => consumer.close());
    producersRef.current.clear();
    consumersRef.current.clear();

    setState({
      isConnected: false,
      isConnecting: false,
      roomId: null,
      userId: null,
      users: [],
      remoteStreams: [],
      localStream: null,
      error: null,
      chatMessages: [],
      sendTransport: null,
      recvTransport: null
    });

    deviceRef.current = null;
  }, []);

  const sendChatMessage = useCallback((text: string) => {
    if (!socketRef.current) return;
    
    const chatMsg = { type: 'chat-message', data: { text } };
    socketRef.current.send(JSON.stringify(chatMsg));
  }, []);

  const contextValue: MediasoupContextType = {
    ...state,
    connect,
    disconnect,
    publishStream,
    unpublishStream,
    sendChatMessage
  };

  return (
    <MediasoupContext.Provider value={contextValue}>
      {children}
    </MediasoupContext.Provider>
  );
};

export const useMediasoup = () => {
  const context = useContext(MediasoupContext);
  if (!context) {
    throw new Error('useMediasoup must be used within a MediasoupProvider');
  }
  return context;
};