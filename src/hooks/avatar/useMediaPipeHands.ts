// src/hooks/useMediaPipeHands.ts
import { useState, useRef, useCallback } from 'react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { MEDIAPIPE_WASM_URL, HAND_LANDMARKER_MODEL_URL } from '@/data/mediapipeUrls';

export const useMediaPipeHands = () => {
  const [isReady, setIsReady] = useState(false);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const lastMicrosRef = useRef(0); // ✅ используем ref

  const init = useCallback(async () => {
    if (handLandmarkerRef.current || isReady) return;

    try {
      const filesetResolver = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);
      const handLandmarker = await HandLandmarker.createFromOptions(filesetResolver, {
        baseOptions: { modelAssetPath: HAND_LANDMARKER_MODEL_URL, delegate: 'GPU' },
        numHands: 2,
        runningMode: 'VIDEO',
      });
      handLandmarkerRef.current = handLandmarker;
      setIsReady(true);
    } catch (err) {
      console.error('Failed to initialize Hand Landmarker:', err);
    }
  }, [isReady]);

  const detect = useCallback((video: HTMLVideoElement, timestampMs: number) => {
    if (!handLandmarkerRef.current) return null;

    const micros = Math.floor(timestampMs * 1000);
    const safeMicros = Math.max(micros, lastMicrosRef.current + 1);
    lastMicrosRef.current = safeMicros; // ✅ сохраняем в ref

    return handLandmarkerRef.current.detectForVideo(video, safeMicros);
  }, []);

  const destroy = useCallback(() => {
    handLandmarkerRef.current?.close();
    handLandmarkerRef.current = null;
    setIsReady(false);
    lastMicrosRef.current = 0; // ✅ сброс через ref
  }, []);

  return { isReady, init, detect, destroy };
};