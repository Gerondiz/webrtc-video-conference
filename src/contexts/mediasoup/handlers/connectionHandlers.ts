// contexts/mediasoup/handlers/connectionHandlers.ts
import { Device } from 'mediasoup-client';
import { MediasoupState } from '../types';

export const handleConnection = async (
  signalingUrl: string,
  roomId: string,
  username: string,
  state: MediasoupState
) => {
  // Реализация подключения
};

export const handleDisconnection = (state: MediasoupState) => {
  // Реализация отключения
};