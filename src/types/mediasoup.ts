// src/types/mediasoup.ts
export interface IceCandidate {
  foundation: string;
  priority: number;
  ip: string;
  protocol: 'udp' | 'tcp';
  port: number;
  type: 'host' | 'srflx' | 'prflx' | 'relay';
  tcpType?: 'passive' | 'active' | 'so';
}

export interface IceParameters {
  usernameFragment: string;
  password: string;
  iceLite?: boolean;
}

export interface DtlsParameters {
  role?: 'auto' | 'client' | 'server';
  fingerprints: DtlsFingerprint[];
}

export interface DtlsFingerprint {
  algorithm: string;
  value: string;
}

export interface RtpCapabilities {
  codecs: RtpCodecCapability[];
  headerExtensions: RtpHeaderExtension[];
}

export interface RtpCodecCapability {
  kind: 'audio' | 'video';
  mimeType: string;
  preferredPayloadType?: number;
  clockRate: number;
  channels?: number;
  parameters?: any;
  rtcpFeedback?: RtcpFeedback[];
}

export interface RtpHeaderExtension {
  kind: 'audio' | 'video';
  uri: string;
  preferredId: number;
  preferredEncrypt?: boolean;
  direction?: 'sendrecv' | 'sendonly' | 'recvonly' | 'inactive';
}

export interface RtcpFeedback {
  type: string;
  parameter?: string;
}

export interface RtpParameters {
  codecs: RtpCodecParameters[];
  headerExtensions?: RtpHeaderExtensionParameters[];
  encodings?: RtpEncodingParameters[];
  rtcp?: RtcpParameters;
}

export interface RtpCodecParameters {
  mimeType: string;
  payloadType: number;
  clockRate: number;
  channels?: number;
  parameters?: any;
  rtcpFeedback?: RtcpFeedback[];
}

export interface RtpHeaderExtensionParameters {
  uri: string;
  id: number;
  encrypt?: boolean;
  parameters?: any;
}

export interface RtpEncodingParameters {
  ssrc?: number;
  rid?: string;
  codecPayloadType?: number;
  rtx?: { ssrc: number };
  dtx?: boolean;
  scalabilityMode?: string;
  scaleResolutionDownBy?: number;
  maxBitrate?: number;
  maxFramerate?: number;
  adaptivePtime?: boolean;
  priority?: 'very-low' | 'low' | 'medium' | 'high';
  networkPriority?: 'very-low' | 'low' | 'medium' | 'high';
}

export interface RtcpParameters {
  cname?: string;
  reducedSize?: boolean;
  mux?: boolean;
}