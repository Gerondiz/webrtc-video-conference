// src/hooks/useChatPanel.ts
'use client';

import { useState, useEffect, useRef } from 'react';
import { useChatStore } from '@/stores/useChatStore';
import { useToastHandler } from '@/hooks/useToastHandler';

export const useChatPanel = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const messages = useChatStore(state => state.messages);
  const { showInfo } = useToastHandler();
  const previousMessageCount = useRef(messages.length);

  // Отслеживаем новые сообщения когда чат свернут
  useEffect(() => {
    // Проверяем только новые сообщения (не всю историю)
    if (!isChatOpen && messages.length > previousMessageCount.current) {
      const newMessages = messages.slice(previousMessageCount.current);
      
      // Фильтруем только чужие сообщения
      const foreignMessages = newMessages.filter(msg => msg.from !== 'You');
      
      if (foreignMessages.length > 0) {
        setHasNewMessages(true);
        
        // Показываем уведомление только о последнем сообщении
        const lastMessage = foreignMessages[foreignMessages.length - 1];
        showInfo(`New message from ${lastMessage.from}: ${lastMessage.text.length > 30 ? lastMessage.text.substring(0, 30) + '...' : lastMessage.text}`);
      }
    }
    
    // Обновляем счетчик предыдущих сообщений
    previousMessageCount.current = messages.length;
  }, [messages, isChatOpen, showInfo]);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
    if (!isChatOpen) {
      // При открытии чата сбрасываем индикатор новых сообщений
      setHasNewMessages(false);
    }
  };

  return {
    isChatOpen,
    hasNewMessages,
    toggleChat
  };
};