// src/hooks/useAudioActivity.ts (новый хук для определения активности речи)
'use client';
import { useState, useEffect, useRef } from 'react';

interface AudioActivityOptions {
  threshold?: number; // Порог чувствительности (0-1)
  interval?: number;  // Интервал проверки (мс)
}

export const useAudioActivity = (
  stream: MediaStream | null, 
  options: AudioActivityOptions = {}
) => {
  const { threshold = 0.05, interval = 100 } = options;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    if (!stream) return;

    const initAudioAnalysis = async () => {
      try {
        // Создаем AudioContext
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioContext = audioContextRef.current;

        // Получаем аудио трек
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) return;

        // Создаем источник
        const source = audioContext.createMediaStreamSource(stream);
        
        // Создаем анализатор
        analyserRef.current = audioContext.createAnalyser();
        analyserRef.current.fftSize = 256;
        
        // Подключаем
        source.connect(analyserRef.current);
        
        // Создаем массив для данных
        const bufferLength = analyserRef.current.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);
      } catch (error) {
        console.warn('Audio analysis not available:', error);
      }
    };

    initAudioAnalysis();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stream]);

  // Проверяем уровень звука
  useEffect(() => {
    if (!analyserRef.current || !dataArrayRef.current) return;

    const checkAudioLevel = () => {
      if (!analyserRef.current || !dataArrayRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      
      // Вычисляем средний уровень
      let sum = 0;
      for (let i = 0; i < dataArrayRef.current.length; i++) {
        sum += dataArrayRef.current[i];
      }
      const avg = sum / dataArrayRef.current.length / 255; // Нормализуем до 0-1
      
      setAudioLevel(avg);
      setIsSpeaking(avg > threshold);
    };

    const intervalId = setInterval(checkAudioLevel, interval);
    return () => clearInterval(intervalId);
  }, [threshold, interval]);

  return { isSpeaking, audioLevel };
};