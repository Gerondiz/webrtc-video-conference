// src/types.ts

//типы принимаемые сигнальным сервером

export interface User {
  id: string;
  username: string;
  sessionId?: string; // Добавляем опциональное поле
  joinedAt: string;
  isConnected: boolean;
}

export interface UserJoinedMessage {
  type: 'user-joined';
  data: {
    user: User;
  };
}

export interface UserLeftMessage {
  type: 'user-left';
  data: {
    user: User;
    userId?: string;
  };
}

export interface UserConnectionStatusMessage {
  type: 'user-connection-status';
  data: {
    userId: string;
    isConnected: boolean;
  };
}

export interface JoinRoomMessage {
  type: 'join-room';
  data: {
    roomId: string;
    username: string;
    sessionId: string;
  };
}

export interface JoinedMessage {
  type: 'joined';
  data: {
    roomId: string;
    users: User[];
    sessionId: string;
  };
}
export interface LeaveRoomMessage {
  type: 'leave-room';
  data: {
    roomId: string;
    username: string;
    sessionId: string;
  };
}
export interface ChatMessageData {
  type: 'chat-message';
  data: {
    from: string;
    text: string;
    timestamp: string;
  };
}

export interface UsersUpdatedMessage {
  type: 'users-updated';
  data: {
    users: User[];
  };
}

export interface ErrorMessage {
  type: 'error';
  data: {
    message: string;
  };
}

//остальное
export interface RemoteStream {
  userId: string;
  username: string;
  stream: MediaStream;
}

export interface ChatMessage {
  id: string;
  from: string;
  text: string;
  timestamp: Date;
}

export interface MediaDeviceInfo {
  deviceId: string;
  kind: MediaDeviceKind;
  label: string;
  groupId: string;
}

export interface MediaDevices {
  audioInputs: MediaDeviceInfo[];
  videoInputs: MediaDeviceInfo[];
}

export interface MediaDevicesStatus {
  hasCamera: boolean;
  hasMicrophone: boolean;
}



export interface Room {
  id: string;
  users: User[];
  hasPassword: boolean;
}
export interface RoomResponse {
  success: boolean;
  roomId?: string;
  message?: string;
}

export interface UserMedia {
  stream: MediaStream | null;
  hasCamera: boolean;
  hasMicrophone: boolean;
}

// Базовый тип для всех сообщений WebSocket
export type WebSocketMessage =
  | JoinRoomMessage
  | LeaveRoomMessage
  | ChatMessageData
  | UserJoinedMessage
  | UserConnectionStatusMessage
  | UserLeftMessage
  | JoinedMessage
  | UsersUpdatedMessage
  | ErrorMessage
