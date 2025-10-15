// src/hooks/useMediaPipeFace.ts
import { useState, useRef, useCallback } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { MEDIAPIPE_WASM_URL, FACE_LANDMARKER_MODEL_URL } from '@/data/mediapipeUrls';

export const useMediaPipeFace = () => {
  const [isReady, setIsReady] = useState(false);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);

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

  const detect = useCallback((video: HTMLVideoElement, timestamp: number) => {
    if (!faceLandmarkerRef.current) return null;
    return faceLandmarkerRef.current.detectForVideo(video, timestamp);
  }, []);

  const destroy = useCallback(() => {
    faceLandmarkerRef.current?.close();
    faceLandmarkerRef.current = null;
    setIsReady(false);
  }, []);

  return { isReady, init, detect, destroy };
};