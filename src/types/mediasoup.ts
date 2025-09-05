// types/mediasoup.ts
export interface IceParameters {
  usernameFragment: string;
  password: string;
}

export interface IceCandidate {
  foundation: string;
  priority: number;
  ip: string;
  protocol: 'udp' | 'tcp';
  port: number;
  type: 'host' | 'srflx' | 'prflx' | 'relay';
  tcpType?: 'active' | 'passive' | 'so';
}

export interface DtlsParameters {
  role?: 'auto' | 'client' | 'server';
  fingerprints: Array<{
    algorithm: string;
    value: string;
  }>;
}

export interface TransportOptions {
  id: string;
  iceParameters: IceParameters;
  iceCandidates: IceCandidate[];
  dtlsParameters: DtlsParameters;
  iceServers?: RTCIceServer[];
  sctpParameters?: unknown;
}

export interface RtpCapabilities {
  codecs: unknown[];
  headerExtensions: unknown[];
}

export interface RtpParameters {
  codecs: unknown[];
  headerExtensions: unknown[];
  rtcp: unknown;
}

export interface ProducerOptions {
  track: MediaStreamTrack;
  encodings?: unknown[];
  codecOptions?: unknown;
  appData?: Record<string, unknown>;
}

export interface ConsumerOptions {
  id: string;
  producerId: string;
  kind: 'audio' | 'video';
  rtpParameters: RtpParameters;
  appData?: Record<string, unknown>;
}