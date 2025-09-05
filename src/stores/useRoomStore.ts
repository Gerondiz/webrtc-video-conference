// src/stores/useRoomStore.ts
import { create } from 'zustand';
import { User } from '@/types';

interface RoomStore {
  wsConnected: boolean;
  wsConnecting: boolean;
  users: User[];
  isMicMuted: boolean;
  isCameraOff: boolean;
  
  // Действия
  setWsConnected: (connected: boolean) => void;
  setWsConnecting: (connecting: boolean) => void;
  setUsers: (users: User[]) => void;
  addUser: (user: User) => void;
  removeUser: (userId: string) => void;
  updateUserConnectionStatus: (userId: string, isConnected: boolean) => void;
  toggleMic: () => void;
  toggleCamera: () => void;
  reset: () => void;
}

export const useRoomStore = create<RoomStore>((set) => ({
  wsConnected: false,
  wsConnecting: true,
  users: [],
  isMicMuted: false,
  isCameraOff: false,

  setWsConnected: (connected) => set({ wsConnected: connected }),
  setWsConnecting: (connecting) => set({ wsConnecting: connecting }),
  
  setUsers: (users) => set({ users: [...users] }),
  
  addUser: (user) => set((state) => {
    // Проверяем, нет ли уже пользователя с таким ID
    const userExists = state.users.some(u => u.id === user.id);
    if (userExists) {
      return { users: state.users.map(u => u.id === user.id ? user : u) };
    }
    return { users: [...state.users, user] };
  }),
  
  removeUser: (userId) => set((state) => ({
    users: state.users.filter(user => user.id !== userId)
  })),
  
  updateUserConnectionStatus: (userId, isConnected) => set((state) => ({
    users: state.users.map(user => 
      user.id === userId ? { ...user, isConnected } : user
    )
  })),
  
  toggleMic: () => set((state) => ({ isMicMuted: !state.isMicMuted })),
  toggleCamera: () => set((state) => ({ isCameraOff: !state.isCameraOff })),
  
  reset: () => set({
    wsConnected: false,
    wsConnecting: true,
    users: [],
    isMicMuted: false,
    isCameraOff: false,
  }),
}));