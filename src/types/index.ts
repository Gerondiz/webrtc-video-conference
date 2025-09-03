// src/types.ts
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

export interface UserJoinedMessage {
  type: 'user-joined';
  user: string;
}

export interface UserLeftMessage {
  type: 'user-left';
  user: string;
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

export interface ChatMessageData {
  type: 'chat-message';
  from: string;
  text: string;
  timestamp?: string;
}

export interface ErrorMessage {
  type: 'error';
  message: string;
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

export interface JoinRoomMessage {
  type: 'join-room';
  roomId: string;
  username: string;
}

export interface LeaveRoomMessage {
  type: 'leave-room';
  roomId: string;
  username: string;
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
  | ErrorMessage;