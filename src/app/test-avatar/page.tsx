// src/app/test-avatar/page.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useMediaStream } from '@/contexts/MediaStreamContext';
import { useMediaPipeFace } from '@/hooks/avatar/useMediaPipeFace';
import { useHeadRotation } from '@/hooks/avatar/useHeadRotation';
import { useThreeAvatar } from '@/hooks/avatar/useThreeAvatar';
import BlendshapeDebugger from '@/components/Animated/BlendshapeDebugger';
import { emotionMapping } from '@/data/emotionMapping';

const AVATAR_PATH = '/models/Anime_School_Teacher.GLB';

export default function TestAvatarPage() {
  const { stream, initMedia, isInitializing, error } = useMediaStream();
  const [hasMediaInitialized, setHasMediaInitialized] = useState(false);
  const [mode, setMode] = useState<'none' | 'avatar-face'>('none');
  const [currentBlendshapes, setCurrentBlendshapes] = useState<Array<{ displayName: string; score: number }> | null>(null);
  const [faceLandmarks, setFaceLandmarks] = useState<Array<{ x: number; y: number; z: number }> | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Хуки
  const { isReady: isFaceReady, init: initFace, detect: detectFace, destroy: destroyFace } = useMediaPipeFace();
  const { yaw, pitch, roll } = useHeadRotation(faceLandmarks); // ✅ теперь landmarks из состояния
  const { mountRef, isLoaded, loadAvatar, applyEmotion, resetMorphs, applyHeadRotation } = useThreeAvatar(AVATAR_PATH);

  // Применяем поворот головы при изменении углов
  useEffect(() => {
    if (mode === 'avatar-face') {
      applyHeadRotation({ yaw, pitch, roll });
    }
  }, [yaw, pitch, roll, mode, applyHeadRotation]);

  // Инициализация медиа
  useEffect(() => {
    if (!hasMediaInitialized) {
      initMedia({ video: true, audio: false }).finally(() => setHasMediaInitialized(true));
    }
  }, [initMedia, hasMediaInitialized]);

  // Привязка потока
  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream || null;
  }, [stream]);

  // Основной цикл
  useEffect(() => {
    if (mode === 'none' || !stream || !isFaceReady || !isLoaded) return;

    const processFrame = (timestamp: number) => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) {
        requestAnimationFrame(processFrame);
        return;
      }

      const result = detectFace(video, timestamp);
      if (result) {
        // Обновляем landmarks для хука поворота
        if (result.faceLandmarks?.[0]) {
          setFaceLandmarks(result.faceLandmarks[0]);
        } else {
          setFaceLandmarks(null);
        }

        // Обновляем эмоции
        if (result.faceBlendshapes?.[0]?.categories) {
          const categories = result.faceBlendshapes[0].categories;
          setCurrentBlendshapes([...categories]);
          applyEmotion(emotionMapping, categories);
        } else {
          setCurrentBlendshapes(null);
          resetMorphs();
        }
      } else {
        setFaceLandmarks(null);
        setCurrentBlendshapes(null);
        resetMorphs();
      }

      requestAnimationFrame(processFrame);
    };

    requestAnimationFrame(processFrame);

    return () => {
      resetMorphs();
    };
  }, [mode, stream, isFaceReady, isLoaded, detectFace, applyEmotion, resetMorphs]);

  // Загрузка зависимостей
  useEffect(() => {
    if (mode === 'avatar-face') {
      if (!isFaceReady) initFace();
      if (!isLoaded) loadAvatar();
    }
  }, [mode, isFaceReady, isLoaded, initFace, loadAvatar]);

  // Очистка
  useEffect(() => {
    return () => {
      destroyFace();
    };
  }, [destroyFace]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Тест аватаров</h1>
      {error && <div className="text-red-500 mb-4">Ошибка: {error}</div>}
      {isInitializing && <div className="mb-4">Инициализация камеры...</div>}

      <div className="flex gap-2 mb-6">
        <button onClick={() => setMode('none')} className={mode === 'none' ? 'bg-blue-600 text-white' : 'bg-gray-200'}>Видео</button>
        <button onClick={() => setMode('avatar-face')} className={mode === 'avatar-face' ? 'bg-blue-600 text-white' : 'bg-gray-200'}>Аватар + Лицо</button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/2">
          <h2 className="text-lg font-semibold mb-2">Камера</h2>
          <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', aspectRatio: '16/9' }} />
        </div>

        <div className="w-full md:w-1/2">
          <h2 className="text-lg font-semibold mb-2">Аватар</h2>
          <div ref={mountRef} style={{ width: '100%', height: '400px', background: '#1a1a1a' }} />
          {mode === 'avatar-face' && currentBlendshapes && (
            <BlendshapeDebugger blendshapes={currentBlendshapes} />
          )}
        </div>
      </div>
    </div>
  );
}