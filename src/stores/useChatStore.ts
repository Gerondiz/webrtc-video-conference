// src/stores/useChatStore.ts
import { create } from 'zustand';
import { ChatMessage } from '@/types';

interface ChatStore {
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  setMessages: (messages: ChatMessage[]) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),
  
  clearMessages: () => set({ messages: [] }),
  
  setMessages: (messages) => set({ messages })
}));