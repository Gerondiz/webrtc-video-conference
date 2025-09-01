// src/hooks/useWebSocket.ts
'use client';
import { useEffect, useRef, useCallback, useState } from 'react';
import { WebSocketMessage } from '@/types';

interface UseWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  sendMessage: (message: WebSocketMessage) => boolean;
  addMessageHandler: <T = unknown>(type: string, handler: (data: T) => void) => void;
  removeMessageHandler: (type: string) => void;
  messages: WebSocketMessage[];
  disconnect: () => void;
  connect: () => void;
  error: string | null;
}

export const useWebSocket = (url: string): UseWebSocketReturn => {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const messageHandlers = useRef<Map<string, (data: unknown) => void>>(
    new Map()
  );
  const isMounted = useRef(true);

  const connect = useCallback(() => {
    if (!isMounted.current || isConnecting) return;

    if (ws.current) {
      ws.current.onopen = null;
      ws.current.onclose = null;
      ws.current.onerror = null;
      ws.current.onmessage = null;
      if (ws.current.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
      ws.current = null;
    }

    setIsConnecting(true);
    setError(null);

    try {
      console.log(`Attempting to connect to WebSocket: ${url}`);
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        if (!isMounted.current) return;
        console.log('WebSocket connected successfully');
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
      };

      ws.current.onclose = (event) => {
        if (!isMounted.current) return;
        console.log(`WebSocket disconnected: ${event.code} ${event.reason}`);
        setIsConnected(false);
        setIsConnecting(false);

        if (event.code !== 1000) {
          setError(
            `Connection closed: ${event.code} ${event.reason || 'No reason provided'}`
          );
        }
      };

      ws.current.onerror = (event) => {
        if (!isMounted.current) return;
        console.error('WebSocket error:', event);
        setIsConnecting(false);
        setError('WebSocket connection error');
      };

      ws.current.onmessage = (event) => {
        if (!isMounted.current) return;
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('Received WebSocket message:', message);

          const handler = messageHandlers.current.get(message.type);
          if (handler) {
            handler(message.data);
          }
          setMessages((prev) => [...prev, message]);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error, event.data);
        }
      };
    } catch (error: unknown) {
      console.error('WebSocket connection error:', error);
      setIsConnecting(false);
      setError(`Failed to create WebSocket: ${(error as Error).message}`);
    }
  }, [url, isConnecting]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      try {
        const messageStr = JSON.stringify(message);
        ws.current.send(messageStr);
        console.log('Sent WebSocket message:', message);
        return true;
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        setError('Failed to send message');
        return false;
      }
    } else {
      console.warn('WebSocket is not connected, message not sent:', message);
      setError('WebSocket is not connected');
      return false;
    }
  }, []);

  const addMessageHandler = useCallback(
    <T = unknown>(type: string, handler: (data: T) => void) => {
      messageHandlers.current.set(type, handler as (data: unknown) => void);
    },
    []
  );

  const removeMessageHandler = useCallback((type: string) => {
    messageHandlers.current.delete(type);
  }, []);

  const disconnect = useCallback(() => {
    if (ws.current) {
      ws.current.close(1000, 'Client disconnected');
      ws.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setError(null);
  }, []);

  useEffect(() => {
    isMounted.current = true;
    connect();
    return () => {
      isMounted.current = false;
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    isConnecting,
    sendMessage,
    addMessageHandler,
    removeMessageHandler,
    messages,
    disconnect,
    connect,
    error,
  };
};