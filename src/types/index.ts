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

// типы для Mediasoup сообщений
export interface MediasoupTransportCreatedMessage {
  type: 'webRtcTransportCreated';
  data: {
    transportId: string;
    direction: 'send' | 'recv';
    iceParameters: {
      usernameFragment: string;
      password: string;
    };
    iceCandidates: Array<{
      foundation: string;
      priority: number;
      ip: string;
      protocol: 'udp' | 'tcp';
      port: number;
      type: 'host' | 'srflx' | 'prflx' | 'relay';
      tcpType?: 'active' | 'passive' | 'so';
    }>;
    dtlsParameters: {
      role?: 'auto' | 'client' | 'server';
      fingerprints: Array<{
        algorithm: string;
        value: string;
      }>;
    };
  };
}

export interface MediasoupNewProducerMessage {
  type: 'new-producer';
  data: {
    producerId: string;
    userId: string;
    kind: 'audio' | 'video';
  };
}

export interface MediasoupProducerClosedMessage {
  type: 'producer-closed';
  data: {
    producerId: string;
    userId: string;
  };
}

export interface MediasoupConsumeMessage {
  type: 'consumed';
  data: {
    id: string;
    producerId: string;
    kind: 'audio' | 'video';
    rtpParameters: {
      codecs: unknown[];
      headerExtensions: unknown[];
      rtcp: unknown;
    };
    userId: string;
  };
}

// export interface MediasoupTransportCreatedMessage {
//   type: 'webRtcTransportCreated';
//   data: {
//     id: string;
//     iceParameters: IceParameters;
//     iceCandidates: IceCandidate[];
//     dtlsParameters: DtlsParameters;
//     direction: 'send' | 'recv';
//   };
// }

// Добавим недостающие типы сообщений
export interface TransportConnectedMessage {
  type: 'transport-connected';
  data: {
    transportId: string;
  };
}

export interface ProducedMessage {
  type: 'produced';
  data: {
    id: string;
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
export interface MediasoupJoinRoomMessage {
  type: 'join-room';
  data: {
    roomId: string;
    username: string;
  };
}

export interface MediasoupLeaveRoomMessage {
  type: 'leave-room';
  data: {
    roomId: string;
    username: string;
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
  | JoinedMessage
  | ErrorMessage
  | MediasoupJoinRoomMessage
  | MediasoupLeaveRoomMessage
  | MediasoupTransportCreatedMessage;


// Расширим основной тип сообщений
export type ExtendedWebSocketMessage = WebSocketMessage |
  MediasoupTransportCreatedMessage |
  MediasoupNewProducerMessage |
  MediasoupProducerClosedMessage |
  MediasoupConsumeMessage |
  TransportConnectedMessage |
  ProducedMessage |
  ProducersListMessage;