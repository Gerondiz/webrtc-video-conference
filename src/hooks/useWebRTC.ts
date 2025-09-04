// src/hooks/useWebRTC.ts
'use client';

import { useRef, useCallback } from 'react';
import { WebRTCSignal } from '@/types';

interface UseWebRTCOptions {
  onRemoteStream?: (stream: MediaStream, userId: string) => void;
  onDataChannelMessage?: (message: string, userId: string) => void;
}


export const useWebRTC = (options: UseWebRTCOptions = {}) => {
  const localStream = useRef<MediaStream | null>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const dataChannels = useRef<Map<string, RTCDataChannel>>(new Map());


  // Создание peer connection
  const createPeerConnection = useCallback((userId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        {
          urls: 'turn:20.0.0.107:3478',
          username: 'turnuser',
          credential: '12345678'
        }
      ]
    });

    // Добавляем локальные треки
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => {
        pc.addTrack(track, localStream.current!);
      });
    }

    // Обработка входящих треков
    pc.ontrack = (event) => {
      if (options.onRemoteStream) {
        options.onRemoteStream(event.streams[0], userId);
      }
    };

    // Обработка ICE кандидатов
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        // Кандидат будет отправлен через сигнальный сервер
        const signal: WebRTCSignal = {
          type: 'webrtc-ice-candidate',
          payload: event.candidate
        };
        // Здесь нужно отправить сигнал через WebSocket
        console.log('ICE candidate generated:', signal);
      }
    };

    // Создание data channel для чата
    const dc = pc.createDataChannel('chat', { negotiated: true, id: 0 });
    dataChannels.current.set(userId, dc);

    dc.onmessage = (event) => {
      if (options.onDataChannelMessage) {
        options.onDataChannelMessage(event.data, userId);
      }
    };

    dc.onopen = () => {
      console.log('Data channel opened for user:', userId);
    };

    peerConnections.current.set(userId, pc);
    return pc;
  }, [options]);

  // Остальные функции остаются без изменений
  // Создание offer
  const createOffer = useCallback(async (userId: string) => {
    const pc = createPeerConnection(userId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    return offer;
  }, [createPeerConnection]);

  // Обработка offer
  const handleOffer = useCallback(async (userId: string, offer: RTCSessionDescriptionInit) => {
    const pc = createPeerConnection(userId);
    await pc.setRemoteDescription(offer);

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    return answer;
  }, [createPeerConnection]);

  // Обработка answer
  const handleAnswer = useCallback(async (userId: string, answer: RTCSessionDescriptionInit) => {
    const pc = peerConnections.current.get(userId);
    if (pc) {
      await pc.setRemoteDescription(answer);
    }
  }, []);

  // Обработка ICE кандидата
  const handleIceCandidate = useCallback(async (userId: string, candidate: RTCIceCandidateInit) => {
    const pc = peerConnections.current.get(userId);
    if (pc) {
      await pc.addIceCandidate(candidate);
    }
  }, []);

  // Отправка сообщения через data channel
  const sendDataMessage = useCallback((userId: string, message: string) => {
    const dc = dataChannels.current.get(userId);
    if (dc && dc.readyState === 'open') {
      dc.send(message);
    }
  }, []);

  // Очистка
  const cleanup = useCallback(() => {
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
      localStream.current = null;
    }

    peerConnections.current.forEach(pc => pc.close());
    peerConnections.current.clear();

    dataChannels.current.clear();
  }, []);

  return {
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    sendDataMessage,
    cleanup
  };
};