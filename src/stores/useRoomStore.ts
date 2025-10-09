// src/stores/useRoomStore.ts
import { create } from 'zustand';
import { User } from '@/types';

interface RoomStore {
  wsConnected: boolean;
  wsConnecting: boolean;
  users: User[];
  currentUserId: string | null;

  // Действия
  setWsConnected: (connected: boolean) => void;
  setWsConnecting: (connecting: boolean) => void;
  setCurrentUserId: (id: string | null) => void;
  setUsers: (users: User[]) => void;
  addUser: (user: User) => void;
  removeUser: (userId: string) => void;
  updateUserConnectionStatus: (userId: string, isConnected: boolean) => void;
  updateUserMicStatus: (userId: string, isMuted: boolean) => void;
  reset: () => void;
}

export const useRoomStore = create<RoomStore>((set) => ({
  wsConnected: false,
  wsConnecting: true,
  users: [],
  currentUserId: null,

  setWsConnected: (connected) => set({ wsConnected: connected }),
  setWsConnecting: (connecting) => set({ wsConnecting: connecting }),
  setCurrentUserId: (id) => set({ currentUserId: id }),

  setUsers: (users) => {
    const username = sessionStorage.getItem('username') || 'Anonymous';
    const me = users.find((u) => u.username === username);
    set({
      users: [...users],
      currentUserId: me?.id || null,
    });
  },

  addUser: (user) =>
    set((state) => {
      const userExists = state.users.some((u) => u.id === user.id);
      if (userExists) {
        return {
          users: state.users.map((u) => (u.id === user.id ? user : u)),
        };
      }
      return { users: [...state.users, user] };
    }),

  removeUser: (userId) =>
    set((state) => ({
      users: state.users.filter((user) => user.id !== userId),
    })),

  updateUserConnectionStatus: (userId, isConnected) =>
    set((state) => ({
      users: state.users.map((user) =>
        user.id === userId ? { ...user, isConnected } : user
      ),
    })),

  updateUserMicStatus: (userId, isMuted) =>
    set((state) => ({
      users: state.users.map((u) =>
        u.id === userId ? { ...u, isMicMuted: isMuted } : u
      ),
    })),

  reset: () =>
    set({
      wsConnected: false,
      wsConnecting: true,
      users: [],
      currentUserId: null,
    }),
}));