// src/hooks/useActiveSpeakerDetection.ts
import { useEffect, useState, useRef } from 'react';

// Расширяем глобальный Window, чтобы TypeScript знал о webkitAudioContext
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export function useActiveSpeakerDetection(
  remoteStreams: { userId: string; stream: MediaStream }[],
  localStream: MediaStream | null,
  currentUserId: string | null,
  isEnabled: boolean
) {
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const analyzersRef = useRef<Map<string, AnalyserNode>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!isEnabled) {
      setActiveSpeakerId(null);
      return;
    }

    // Создаём AudioContext только при первом запуске
    if (!audioContextRef.current) {
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextCtor) {
        console.warn('Web Audio API not supported');
        return;
      }
      audioContextRef.current = new AudioContextCtor();
    }

    // Теперь audioContext точно не null
    const audioContext = audioContextRef.current;

    const streams = [
      ...(localStream && currentUserId
        ? [{ userId: currentUserId, stream: localStream }]
        : []),
      ...remoteStreams,
    ];

    // Удаляем старые анализаторы
    for (const [userId, analyzer] of analyzersRef.current.entries()) {
      if (!streams.some((s) => s.userId === userId)) {
        analyzer.disconnect();
        analyzersRef.current.delete(userId);
      }
    }

    // Создаём новые анализаторы
    for (const { userId, stream } of streams) {
      if (analyzersRef.current.has(userId)) continue;

      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) continue;

      try {
        const source = audioContext.createMediaStreamSource(stream);
        const analyzer = audioContext.createAnalyser();
        analyzer.fftSize = 256;
        source.connect(analyzer);
        analyzersRef.current.set(userId, analyzer);
      } catch (err) {
        console.warn(`Failed to create analyzer for user ${userId}:`, err);
      }
    }

    const getAudioLevel = (analyzer: AnalyserNode): number => {
      const dataArray = new Uint8Array(analyzer.frequencyBinCount);
      analyzer.getByteFrequencyData(dataArray);
      return dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    };

    const THRESHOLD = 30;
    let animationFrameId: number;

    const detectActiveSpeaker = () => {
      let loudestUserId: string | null = null;
      let maxLevel = 0;

      for (const [userId, analyzer] of analyzersRef.current.entries()) {
        const level = getAudioLevel(analyzer);
        if (level > maxLevel && level > THRESHOLD) {
          maxLevel = level;
          loudestUserId = userId;
        }
      }

      setActiveSpeakerId(loudestUserId);
      animationFrameId = requestAnimationFrame(detectActiveSpeaker);
    };

    animationFrameId = requestAnimationFrame(detectActiveSpeaker);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [remoteStreams, localStream, currentUserId, isEnabled]);

  return activeSpeakerId;
}