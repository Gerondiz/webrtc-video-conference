// src/hooks/useWebSocket.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { WebSocketMessage } from '@/types';

type MessageHandler<T = WebSocketMessage> = (message: T) => void;
export interface UseWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  sendMessage: (message: WebSocketMessage) => void;
  addMessageHandler: <T extends WebSocketMessage>(type: string, handler: MessageHandler<T>) => void;
  removeMessageHandler: <T extends WebSocketMessage>(type: string, handler: MessageHandler<T>) => void;
  disconnect: () => void;
}

export const useWebSocket = (url: string): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false); // ✅ Изначально false
  const socketRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Map<string, MessageHandler[]>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ Обновлённый useEffect: проверяет, есть ли URL
  useEffect(() => {
    // Если URL пустой — закрываем текущее соединение (если есть) и выходим
    if (!url) {
      console.warn('WebSocket URL is empty, not connecting.');
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setIsConnected(false);
      setIsConnecting(false);
      return; // ✅ ВАЖНО: выходим из эффекта
    }

    // Если соединение уже существует и открыто — ничего не делаем
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected, reusing existing connection.');
      return;
    }

    // Если есть попытка переподключения — очищаем таймаут
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Создаём новое соединение
    setIsConnecting(true);

    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('✅ WebSocket connected.');
      setIsConnected(true);
      setIsConnecting(false);
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        console.log('📩 Received message:', message.type);
        const handlers = handlersRef.current.get(message.type) || [];
        handlers.forEach(handler => handler(message));
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    socket.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      toast.error('Connection failed. Please try again.');
    };

    socket.onclose = (event) => {
      console.log('🔌 WebSocket disconnected. Code:', event.code, 'Reason:', event.reason);
      setIsConnected(false);
      setIsConnecting(false);

      // Попытка переподключения через 1 секунду, если URL всё ещё есть
      if (url) { // ✅ Проверяем, что URL всё ещё валидный
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Attempting to reconnect WebSocket...');
          // Просто вызываем эффект заново, т.к. он зависит от url
        }, 1000);
      }
    };

    // Очистка при размонтировании или изменении URL
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [url]); // ✅ Зависимость только от URL

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
    } else {
      console.warn('WebSocket is not open. Cannot send message:', message);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  return {
    isConnected,
    isConnecting,
    sendMessage,
    addMessageHandler,
    removeMessageHandler,
    disconnect,
  };
};