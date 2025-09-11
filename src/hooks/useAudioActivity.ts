// src/hooks/useAudioActivity.ts
'use client';
import { useState, useEffect, useRef } from 'react';

interface AudioActivityOptions {
  threshold?: number;
}

export const useAudioActivity = (
  stream: MediaStream | null, 
  options: AudioActivityOptions = {}
) => {
  const { threshold = 0.05 } = options;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    if (!stream) return;

    const initAudioAnalysis = async () => {
      try {
        // Проверяем поддержку AudioContext
        if (typeof window === 'undefined') return;
        
        // Явно указываем тип для AudioContext
        const AudioContextConstructor: typeof AudioContext = 
          window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        
        if (!AudioContextConstructor) {
          console.warn('AudioContext not supported');
          return;
        }

        // Создаем экземпляр с правильным типом
        const audioContext: AudioContext = new AudioContextConstructor();
        audioContextRef.current = audioContext;

        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) return;

        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyserRef.current = analyser;
        analyser.fftSize = 256;
        
        source.connect(analyser);
      } catch (error) {
        console.warn('Audio analysis not available:', error);
      }
    };

    initAudioAnalysis();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [stream]);

  // Анализ аудио в реальном времени
  useEffect(() => {
    if (!analyserRef.current) return;

    const analyzeAudio = () => {
      const analyser = analyserRef.current;
      if (!analyser) return;
      
      try {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = dataArray.length > 0 ? sum / dataArray.length / 255 : 0;
        
        setIsSpeaking(avg > threshold);
      } catch (error) {
        console.warn('Error in audio analysis:', error);
      }
      
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    };

    animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [threshold]);

  return { isSpeaking };
};