// src/hooks/useMediaPipeFace.ts
import { useState, useRef, useCallback } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { MEDIAPIPE_WASM_URL, FACE_LANDMARKER_MODEL_URL } from '@/data/mediapipeUrls';

export const useMediaPipeFace = () => {
  const [isReady, setIsReady] = useState(false);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const lastMicrosRef = useRef(0);

  const init = useCallback(async () => {
    if (faceLandmarkerRef.current || isReady) return;

    try {
      const filesetResolver = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);
      const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: { modelAssetPath: FACE_LANDMARKER_MODEL_URL, delegate: 'GPU' },
        outputFaceBlendshapes: true,
        runningMode: 'VIDEO',
      });
      faceLandmarkerRef.current = faceLandmarker;
      setIsReady(true);
    } catch (err) {
      console.error('Failed to initialize Face Landmarker:', err);
    }
  }, [isReady]);

  const detect = useCallback((video: HTMLVideoElement, timestampMs: number) => {
    if (!faceLandmarkerRef.current) return null;

    // Переводим в микросекунды и обеспечиваем монотонность
    const micros = Math.floor(timestampMs * 1000);
    const safeMicros = Math.max(micros, lastMicrosRef.current + 1);
    lastMicrosRef.current  = safeMicros;

    return faceLandmarkerRef.current.detectForVideo(video, safeMicros);
  }, []);

  const destroy = useCallback(() => {
    faceLandmarkerRef.current?.close();
    faceLandmarkerRef.current = null;
    setIsReady(false);
    lastMicrosRef.current = 0;
  }, []);

  return { isReady, init, detect, destroy };
};