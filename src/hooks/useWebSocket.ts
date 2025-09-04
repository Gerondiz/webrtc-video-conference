// src/hooks/useWebSocket.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  WebSocketMessage, 

} from '@/types';

type MessageHandler<T = WebSocketMessage> = (message: T) => void;

interface UseWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  sendMessage: (message: WebSocketMessage) => void;
  addMessageHandler: <T extends WebSocketMessage>(type: string, handler: MessageHandler<T>) => void;
  removeMessageHandler: <T extends WebSocketMessage>(type: string, handler: MessageHandler<T>) => void;
  disconnect: () => void;
}

export const useWebSocket = (url: string): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const socketRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Map<string, MessageHandler[]>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>(null);

  const addMessageHandler = useCallback(<T extends WebSocketMessage>(type: string, handler: MessageHandler<T>) => {
    if (!handlersRef.current.has(type)) {
      handlersRef.current.set(type, []);
    }
    handlersRef.current.get(type)!.push(handler as MessageHandler);
  }, []);

  const removeMessageHandler = useCallback(<T extends WebSocketMessage>(type: string, handler: MessageHandler<T>) => {
    const handlers = handlersRef.current.get(type);
    if (handlers) {
      handlersRef.current.set(type, handlers.filter(h => h !== handler));
    }
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    }
  }, []);

  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN || socketRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    setIsConnecting(true);
    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setIsConnecting(false);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        const handlers = handlersRef.current.get(message.type) || [];
        handlers.forEach(handler => handler(message));
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      setIsConnecting(false);
      
      // Попытка переподключения с экспоненциальной задержкой
      const delay = Math.min(1000 * Math.pow(2, (reconnectTimeoutRef.current ? 2 : 1)), 10000);
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, delay);
    };
  }, [url]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
  }, []);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    isConnecting,
    sendMessage,
    addMessageHandler,
    removeMessageHandler,
    disconnect,
  };
};