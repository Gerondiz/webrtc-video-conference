// src/stores/useRoomStore.ts
import { create } from 'zustand';
import { ChatMessage } from '@/types';

interface RoomState {
  // Состояние подключения
  wsConnected: boolean;
  wsConnecting: boolean;
  connectionStatus: string;
  connectionError: string | null;
  
  // Пользователи и чат
  users: string[];
  chatMessages: ChatMessage[];
  
  // Состояние устройств (только для UI)
  isMicMuted: boolean;
  isCameraOff: boolean;
  isInitializing: boolean;
  
  // Действия
  setWsConnected: (connected: boolean) => void;
  setWsConnecting: (connecting: boolean) => void;
  setConnectionStatus: (status: string) => void;
  setConnectionError: (error: string | null) => void;
  setUsers: (users: string[]) => void;
  addUser: (user: string) => void;
  removeUser: (user: string) => void;
  addChatMessage: (message: ChatMessage) => void;
  toggleMic: () => void;
  toggleCamera: () => void;
  setIsInitializing: (initializing: boolean) => void;
  reset: () => void;
}

const initialState = {
  wsConnected: false,
  wsConnecting: false,
  connectionStatus: 'connecting',
  connectionError: null,
  users: [],
  chatMessages: [],
  isMicMuted: false,
  isCameraOff: false,
  isInitializing: true,
};

export const useRoomStore = create<RoomState>((set) => ({
  ...initialState,
  setWsConnected: (connected) => set({ wsConnected: connected }),
  setWsConnecting: (connecting) => set({ wsConnecting: connecting }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setConnectionError: (error) => set({ connectionError: error }),
  setUsers: (users) => set({ users }),
  addUser: (user) =>
    set((state) => {
      if (state.users.includes(user)) return state;
      return { users: [...state.users, user] };
    }),
  removeUser: (user) =>
    set((state) => ({
      users: state.users.filter((u) => u !== user),
    })),
  addChatMessage: (message) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, message],
    })),
  toggleMic: () =>
    set((state) => ({
      isMicMuted: !state.isMicMuted
    })),
  toggleCamera: () =>
    set((state) => ({
      isCameraOff: !state.isCameraOff
    })),
  setIsInitializing: (initializing) => set({ isInitializing: initializing }),
  reset: () => set(initialState),
}));