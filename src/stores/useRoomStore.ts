import { create } from 'zustand';
import { RemoteStream, ChatMessage } from '@/types';

interface RoomState {
  // Состояние подключения
  isConnected: boolean;
  isConnecting: boolean;
  connectionStatus: string;
  connectionError: string | null;
  
  // Медиа потоки
  localStream: MediaStream | null;
  remoteStreams: RemoteStream[];
  
  // Пользователи и чат
  users: string[];
  chatMessages: ChatMessage[];
  
  // Состояние устройств
  isMicMuted: boolean;
  isCameraOff: boolean;
  showDeviceSelector: boolean;
  isInitializing: boolean;
  
  // Действия
  setConnectionStatus: (status: string) => void;
  setConnectionError: (error: string | null) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  addRemoteStream: (stream: RemoteStream) => void;
  removeRemoteStream: (userId: string) => void;
  addUser: (user: string) => void;
  removeUser: (user: string) => void;
  addChatMessage: (message: ChatMessage) => void;
  toggleMic: () => void;
  toggleCamera: () => void;
  setShowDeviceSelector: (show: boolean) => void;
  setIsInitializing: (initializing: boolean) => void;
  reset: () => void;
}

const initialState = {
  isConnected: false,
  isConnecting: false,
  connectionStatus: 'connecting',
  connectionError: null,
  localStream: null,
  remoteStreams: [],
  users: [],
  chatMessages: [],
  isMicMuted: false,
  isCameraOff: false,
  showDeviceSelector: false,
  isInitializing: true,
};

export const useRoomStore = create<RoomState>((set, get) => ({
  ...initialState,
  
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setConnectionError: (error) => set({ connectionError: error }),
  setLocalStream: (stream) => set({ localStream: stream }),
  
  addRemoteStream: (stream) => 
    set((state) => {
      const existing = state.remoteStreams.find((rs) => rs.userId === stream.userId);
      if (existing) {
        return {
          remoteStreams: state.remoteStreams.map((rs) =>
            rs.userId === stream.userId ? { ...rs, stream: stream.stream } : rs
          ),
        };
      }
      return { remoteStreams: [...state.remoteStreams, stream] };
    }),
  
  removeRemoteStream: (userId) =>
    set((state) => ({
      remoteStreams: state.remoteStreams.filter((rs) => rs.userId !== userId),
    })),
  
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
    set((state) => {
      if (state.localStream) {
        const audioTracks = state.localStream.getAudioTracks();
        audioTracks.forEach((track) => {
          track.enabled = !track.enabled;
        });
      }
      return { isMicMuted: !state.isMicMuted };
    }),
  
  toggleCamera: () =>
    set((state) => {
      if (state.localStream) {
        const videoTracks = state.localStream.getVideoTracks();
        videoTracks.forEach((track) => {
          track.enabled = !track.enabled;
        });
      }
      return { isCameraOff: !state.isCameraOff };
    }),
  
  setShowDeviceSelector: (show) => set({ showDeviceSelector: show }),
  setIsInitializing: (initializing) => set({ isInitializing: initializing }),
  
  reset: () => set(initialState),
}));