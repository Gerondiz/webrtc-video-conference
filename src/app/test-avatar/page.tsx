'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useMediaStream } from '@/contexts/MediaStreamContext';
import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';
import {
  FaceLandmarker,
  HandLandmarker,
  FilesetResolver,
} from '@mediapipe/tasks-vision';

import BlendshapeDebugger from '@/components/Animated/BlendshapeDebugger';
import { emotionMapping } from '@/data/emotionMapping';

type AvatarMode = 'none' | 'avatar-static' | 'avatar-face' | 'avatar-full';

const AVATAR_PATH = '/models/Anime_School_Teacher.GLB';

export default function TestAvatarPage() {
  const { stream, initMedia, isInitializing, error } = useMediaStream();
  const [hasMediaInitialized, setHasMediaInitialized] = useState(false);
  const [mode, setMode] = useState<AvatarMode>('none');
  const [isFaceLandmarkerReady, setIsFaceLandmarkerReady] = useState(false);
  const [isHandLandmarkerReady, setIsHandLandmarkerReady] = useState(false);
  const [currentBlendshapes, setCurrentBlendshapes] = useState<
    Array<{ displayName: string; score: number }> | null
  >(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const avatarRef = useRef<THREE.Object3D | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);

  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameRef = useRef<number>(0);

  // Инициализация медиа
  useEffect(() => {
    if (!hasMediaInitialized) {
      const initialize = async () => {
        try {
          await initMedia({ video: true, audio: false });
        } catch (err) {
          console.error('Init media failed:', err);
        } finally {
          setHasMediaInitialized(true);
        }
      };
      initialize();
    }
  }, [initMedia, hasMediaInitialized]);

  // Привязка потока к видео
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream || null;
    }
  }, [stream]);

  // Инициализация Three.js сцены
  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 1.8;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      if (mixerRef.current) mixerRef.current.update(0.016);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current || !mountRef.current) return;
      const { clientWidth, clientHeight } = mountRef.current;
      cameraRef.current.aspect = clientWidth / clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(clientWidth, clientHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameRef.current);
      if (rendererRef.current?.domElement?.parentElement) {
        rendererRef.current.domElement.parentElement.removeChild(rendererRef.current.domElement);
      }
    };
  }, []);

  // Загрузка аватара
  const loadAvatar = useCallback(async () => {
    if (!sceneRef.current || avatarRef.current) return;

    try {
      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync(AVATAR_PATH);

      const avatar = gltf.scene;
      avatar.scale.set(0.8, 0.8, 0.8);
      avatar.position.y = -1.2;
      avatar.rotation.y = Math.PI;
      avatar.position.z = 1.25;
      sceneRef.current.add(avatar);
      avatarRef.current = avatar;

      if (gltf.animations.length > 0) {
        mixerRef.current = new THREE.AnimationMixer(avatar);
      }
    } catch (err) {
      console.error('Failed to load avatar:', err);
    }
  }, []);

  // Инициализация Face Landmarker
  const initFaceLandmarker = useCallback(async () => {
    if (faceLandmarkerRef.current || isFaceLandmarkerReady) return;

    try {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task',
          delegate: 'GPU',
        },
        outputFaceBlendshapes: true,
        runningMode: 'VIDEO',
      });

      faceLandmarkerRef.current = faceLandmarker;
      setIsFaceLandmarkerReady(true);
    } catch (err) {
      console.error('Failed to initialize Face Landmarker:', err);
    }
  }, [isFaceLandmarkerReady]);

  // Инициализация Hand Landmarker
  const initHandLandmarker = useCallback(async () => {
    if (handLandmarkerRef.current || isHandLandmarkerReady) return;

    try {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      const handLandmarker = await HandLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task',
          delegate: 'GPU',
        },
        numHands: 2,
        runningMode: 'VIDEO',
      });

      handLandmarkerRef.current = handLandmarker;
      setIsHandLandmarkerReady(true);
    } catch (err) {
      console.error('Failed to initialize Hand Landmarker:', err);
    }
  }, [isHandLandmarkerReady]);

  // Цикл обработки кадров
  useEffect(() => {
    if (mode === 'none' || !stream) return;

    if (['avatar-static', 'avatar-face', 'avatar-full'].includes(mode) && !avatarRef.current) {
      loadAvatar();
    }

    if ((mode === 'avatar-face' || mode === 'avatar-full') && !isFaceLandmarkerReady) {
      initFaceLandmarker();
    }
    if (mode === 'avatar-full' && !isHandLandmarkerReady) {
      initHandLandmarker();
    }

    const processFrame = (timestamp: number) => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || video.videoWidth === 0) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      if (
        (mode === 'avatar-face' || mode === 'avatar-full') &&
        faceLandmarkerRef.current &&
        isFaceLandmarkerReady
      ) {
        const faces = faceLandmarkerRef.current.detectForVideo(video, timestamp);

        // Сброс морфов
        avatarRef.current?.traverse(child => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            if (mesh.morphTargetInfluences) {
              mesh.morphTargetInfluences.fill(0);
            }
          }
        });

        if (faces.faceBlendshapes?.[0]?.categories) {
          const categories = faces.faceBlendshapes[0].categories;
          setCurrentBlendshapes([...categories]); // ← ключевая строка: копируем массив

          // Применение морфов
          avatarRef.current?.traverse(child => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;

              // Проверяем, что всё необходимое существует
              if (
                !mesh.morphTargetInfluences ||
                !mesh.morphTargetDictionary ||
                !categories
              ) return;

              // Сброс всех морфов
              mesh.morphTargetInfluences.fill(0);

              emotionMapping.forEach(emotion => {
                const score = categories[emotion.mediaPipeIndex]?.score || 0;
                if (score > 0.5) {
                  const morphIndex = mesh.morphTargetDictionary![emotion.morphName];
                  if (morphIndex !== undefined) {
                    mesh.morphTargetInfluences![morphIndex] = Math.min(score * 2, 1);
                  }
                }
              });
            }
          });
        } else {
          setCurrentBlendshapes(null);
        }
      }

      animationFrameRef.current = requestAnimationFrame(processFrame);
    };

    animationFrameRef.current = requestAnimationFrame(processFrame);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [
    mode,
    stream,
    loadAvatar,
    initFaceLandmarker,
    initHandLandmarker,
    isFaceLandmarkerReady,
    isHandLandmarkerReady,
  ]);

  // Очистка
  useEffect(() => {
    return () => {
      faceLandmarkerRef.current?.close();
      handLandmarkerRef.current?.close();
    };
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Тест аватаров</h1>

      {error && <div className="text-red-500 mb-4">Ошибка: {error}</div>}
      {isInitializing && <div className="mb-4">Инициализация камеры...</div>}

      <div className="flex gap-2 mb-6 flex-wrap">
        {(['none', 'avatar-static', 'avatar-face', 'avatar-full'] as AvatarMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-2 rounded ${mode === m ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
              }`}
          >
            {m === 'none' && 'Видео'}
            {m === 'avatar-static' && 'Аватар (статичный)'}
            {m === 'avatar-face' && 'Аватар + Лицо'}
            {m === 'avatar-full' && 'Аватар + Лицо+Руки'}
          </button>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Видео */}
        <div className="w-full md:w-1/2">
          <h2 className="text-lg font-semibold mb-2">Источник видео</h2>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{
              width: '100%',
              aspectRatio: '16/9',
              opacity: mode === 'none' ? 1 : 0,
              position: mode === 'none' ? 'static' : 'absolute',
              top: mode === 'none' ? 'auto' : '-10000px',
              left: mode === 'none' ? 'auto' : '-10000px',
              pointerEvents: 'none',
            }}
          />
          {mode !== 'none' && (
            <div className="text-sm text-gray-500 italic">Видео скрыто (используется для анализа)</div>
          )}
        </div>

        {/* 3D + Отладка */}
        <div className="w-full md:w-1/2">
          <h2 className="text-lg font-semibold mb-2">Аватар</h2>
          <div ref={mountRef} style={{ width: '100%', height: '400px', background: '#1a1a1a' }} />

          {/* Отладчик — только если есть данные */}
          {mode !== 'none' && currentBlendshapes && (
            <div className="mt-4">
              <BlendshapeDebugger blendshapes={currentBlendshapes} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}