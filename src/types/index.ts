import * as mediasoupClient from 'mediasoup-client';

type IceCandidate = mediasoupClient.types.IceCandidate;
type DtlsParameters = mediasoupClient.types.DtlsParameters;
type RtpParameters = mediasoupClient.types.RtpParameters;
type RtpCapabilities = mediasoupClient.types.RtpCapabilities;

// === Базовые типы для сигнального сервера ===

export interface User {
  id: string;
  username: string;
  sessionId?: string;
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
    rtpCapabilities?: RtpCapabilities;
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


// === Остальные типы ===
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

// === Mediasoup сообщения ===

export interface CreateTransportMessage {
  type: 'create-transport';
  data: {
    direction: 'send' | 'recv';
  };
}

export interface ConnectTransportMessage {
  type: 'connect-transport';
  data: {
    transportId: string;
    dtlsParameters: DtlsParameters;
  };
}
export interface ProduceMessage {
  type: 'produce';
  data: {
    transportId: string;
    kind: 'audio' | 'video';
    rtpParameters: RtpParameters;
  };
}

export interface ConsumeMessage {
  type: 'consume';
  data: {
    transportId: string;
    producerId: string;
    rtpCapabilities: RtpCapabilities;
  };
}

export interface GetProducersMessage {
  type: 'get-producers';
  data: Record<string, never>;
}

export interface ProducedMessage {
  type: 'produced';
  data: {
    producerId: string;
  };
}

export interface ConsumedMessage {
  type: 'consumed';
  data: {
    consumerId: string;
    producerId: string;
    kind: 'audio' | 'video';
    rtpParameters: RtpParameters;
    userId: string;
  };
}

export interface NewProducerMessage {
  type: 'new-producer';
  data: {
    producerId: string;
    userId: string;
    kind: 'audio' | 'video';
  };
}

export interface ProducerClosedMessage {
  type: 'producer-closed';
  data: {
    producerId: string;
    userId: string;
  };
}

export interface ProducersListMessage {
  type: 'producers-list';
  data: {
    producers: Array<{
      producerId: string;
      userId: string;
      kind: 'audio' | 'video';
    }>;
  };
}

export interface WebRtcTransportCreatedMessage {
  type: 'webRtcTransportCreated';
  data: {
    transportId: string;
    direction: 'send' | 'recv';
    iceParameters: IceParameters;
    iceCandidates: IceCandidate[];
    dtlsParameters: DtlsParameters;
  };
}

export interface IceParameters {
  usernameFragment: string;
  password: string;
  iceLite?: boolean;
}
export interface TransportConnectedMessage {
  type: 'transport-connected';
  data: {
    transportId: string;
  };
}

// === Базовый тип для всех сообщений WebSocket ===
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
  | CreateTransportMessage
  | ConnectTransportMessage
  | ProduceMessage
  | ConsumeMessage
  | ConsumedMessage
  | GetProducersMessage
  | ProducedMessage
  | NewProducerMessage
  | ProducerClosedMessage
  | ProducersListMessage
  | WebRtcTransportCreatedMessage
  | TransportConnectedMessage;

// === Типы для Toast ===
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}