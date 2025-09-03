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

export interface WebSocketMessage {
  type: string;
  data?: unknown;
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
  user: string;
}

export interface UserLeftMessage {
  user: string;
}

export interface WebRTCOfferMessage {
  from: string;
  payload: RTCSessionDescriptionInit;
}

export interface WebRTCAnswerMessage {
  from: string;
  payload: RTCSessionDescriptionInit;
}

export interface WebRTCIceCandidateMessage {
  from: string;
  payload: RTCIceCandidateInit;
}

export interface ChatMessageData {
  from: string;
  text: string;
}

export interface ErrorMessage {
  message: string;
}

//build version
export interface RoomResponse {
  success: boolean;
  roomId?: string;
  message?: string;
}

// export interface SignalingMessage {
//   type: string;
//   roomId: string;
//   userId: string;
//   data?: WebRTCSignal | any;
// }

export interface UserMedia {
  stream: MediaStream | null;
  hasCamera: boolean;
  hasMicrophone: boolean;
}

// Добавляем к существующим типам

export interface WebSocketMessage {
  type: string;
  roomId?: string;
  username?: string;
  text?: string;
  timestamp?: string;
  user?: string;
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

export interface UserJoinedMessage {
  type: 'user-joined';
  user: string;
}

export interface UserLeftMessage {
  type: 'user-left';
  user: string;
}