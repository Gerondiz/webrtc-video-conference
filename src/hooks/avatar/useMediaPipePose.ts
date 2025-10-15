// src/hooks/useMediaPipePose.ts
import { useState, useRef, useCallback } from 'react';
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { MEDIAPIPE_WASM_URL, POSE_MODEL_URL } from '@/data/mediapipeUrls';

// Официальный URL модели позы

export const useMediaPipePose = () => {
  const [isReady, setIsReady] = useState(false);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const lastMicrosRef = useRef(0);

  const init = useCallback(async () => {
    if (poseLandmarkerRef.current || isReady) return;

    try {
      const filesetResolver = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);
      const poseLandmarker = await PoseLandmarker.createFromOptions(filesetResolver, {
        baseOptions: { modelAssetPath: POSE_MODEL_URL, delegate: 'GPU' },
        runningMode: 'VIDEO',
        numPoses: 1,
      });
      poseLandmarkerRef.current = poseLandmarker;
      setIsReady(true);
    } catch (err) {
      console.error('Failed to initialize Pose Landmarker:', err);
    }
  }, [isReady]);

  const detect = useCallback((video: HTMLVideoElement, timestampMs: number) => {
    if (!poseLandmarkerRef.current) return null;

    const micros = Math.floor(timestampMs * 1000);
    const safeMicros = Math.max(micros, lastMicrosRef.current + 1);
    lastMicrosRef.current  = safeMicros;

    return poseLandmarkerRef.current.detectForVideo(video, safeMicros);
  }, []);

  const destroy = useCallback(() => {
    poseLandmarkerRef.current?.close();
    poseLandmarkerRef.current = null;
    setIsReady(false);
    lastMicrosRef.current = 0;
  }, []);

  return { isReady, init, detect, destroy };
};