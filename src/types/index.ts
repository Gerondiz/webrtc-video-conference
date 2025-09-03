// src/types.ts

//типы принимаемые сигнальным сервером
export interface UserJoinedMessage {
  type: 'user-joined';
  data: {
    user: string;
  };
}

export interface UserLeftMessage {
  type: 'user-left';
  data: {
    user: string;
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

export interface JoinRoomMessage {
  type: 'join-room';
  data: {
    roomId: string;
    username: string;
  };
}

export interface LeaveRoomMessage {
  type: 'leave-room';
  data: {
    roomId: string;
    username: string;
  };
}

export interface JoinedMessage {
  type: 'joined';
  data: {
    roomId: string;
    users: string[];
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

export interface WebRTCSignal {
  target?: string;
  type?: string;
  payload?: unknown;
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

export interface User {
  id: string;
  username: string;
}

export interface Room {
  id: string;
  users: User[];
  hasPassword: boolean;
}

export interface WebRTCOfferMessage {
  type: 'webrtc-offer';
  from: string;
  payload: RTCSessionDescriptionInit;
}

export interface WebRTCAnswerMessage {
  type: 'webrtc-answer';
  from: string;
  payload: RTCSessionDescriptionInit;
}

export interface WebRTCIceCandidateMessage {
  type: 'webrtc-ice-candidate';
  from: string;
  payload: RTCIceCandidateInit;
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
  | UserLeftMessage
  | WebRTCOfferMessage
  | WebRTCAnswerMessage
  | WebRTCIceCandidateMessage
  | JoinedMessage
  | ErrorMessage;