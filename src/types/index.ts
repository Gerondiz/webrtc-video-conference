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
    rtpCapabilities?: any;
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

//Mediasoup

export interface WebRTCSignal {
  target?: string;
  type?: string;
  payload?: unknown;
}


// SFU Signaling Messages

export interface SfuOfferMessage {
  type: 'sfu-offer';
  data: {
    sdp: string;
    roomId: string;
    userId: string; // опционально, если нужно
  };
}

export interface SfuAnswerMessage {
  type: 'sfu-answer';
  data: {
    sdp: string;
    roomId: string;
  };
}

export interface SfuIceCandidateMessage {
  type: 'sfu-ice-candidate';
  data: {
    candidate: RTCIceCandidateInit;
    roomId: string;
    targetUserId?: string; // если SFU отправляет кандидата конкретному пользователю
  };
}

export interface SfuStreamAddedMessage {
  type: 'sfu-stream-added';
  data: {
    userId: string;
    username: string;
    streamId: string; // можно использовать для сопоставления track'ов
  };
}

export interface SfuStreamRemovedMessage {
  type: 'sfu-stream-removed';
  data: {
    userId: string;
    streamId: string;
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
    dtlsParameters: any;
  };
}

export interface ProduceMessage {
  type: 'produce';
  data: {
    transportId: string;
    kind: 'audio' | 'video';
    rtpParameters: any;
  };
}

export interface ConsumeMessage {
  type: 'consume';
  data: {
    transportId: string;
    producerId: string;
    rtpCapabilities: any;
  };
}

export interface GetProducersMessage {
  type: 'get-producers';
  data: {};
}

export interface ProducedMessage {
  type: 'produced';
  data: {
    producerId: string;
  };
}

export interface ConsumeMessage {
  type: 'consume';
  data: {
    transportId: string;
    producerId: string;
    rtpCapabilities: any;
  };
}

export interface ConsumedMessage {
  type: 'consumed';
  data: {
    consumerId: string;
    producerId: string;
    kind: string;
    rtpParameters: any;
    userId: string;
  };
}

export interface NewProducerMessage {
  type: 'new-producer';
  data: {
    producerId: string;
    userId: string;
    kind: string;
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
      kind: string;
    }>;
  };
}

export interface WebRtcTransportCreatedMessage {
  type: 'webRtcTransportCreated';
  data: {
    transportId: string;
    direction: 'send' | 'recv';
    iceParameters: any;
    iceCandidates: any[];
    dtlsParameters: any;
  };
}

export interface TransportConnectedMessage {
  type: 'transport-connected';
  data: {
    transportId: string;
  };
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
  | SfuOfferMessage
  | SfuAnswerMessage
  | SfuIceCandidateMessage
  | SfuStreamAddedMessage
  | SfuStreamRemovedMessage
  // Mediasoup messages
  | CreateTransportMessage
  | ConnectTransportMessage
  | ProduceMessage
  | ConsumeMessage
  | ConsumedMessage
  | GetProducersMessage
  | ProducedMessage
  | ConsumedMessage
  | NewProducerMessage
  | ProducerClosedMessage
  | ProducersListMessage
  | WebRtcTransportCreatedMessage
  | TransportConnectedMessage;
