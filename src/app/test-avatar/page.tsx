// src/app/test-avatar/page.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { useMediaStream } from "@/contexts/MediaStreamContext";
import { useMediaPipeFace } from "@/hooks/avatar/useMediaPipeFace";
import { useHeadRotation } from "@/hooks/avatar/useHeadRotation";
import { useMediaPipePose } from "@/hooks/avatar/useMediaPipePose";
import { useMediaPipeHands } from "@/hooks/avatar/useMediaPipeHands";
import { useThreeAvatar } from "@/hooks/avatar/useThreeAvatar";
import BlendshapeDebugger from "@/components/Animated/BlendshapeDebugger";
import { emotionMapping } from "@/data/emotionMapping";

const AVATAR_PATH = "/models/Anime_School_Teacher.GLB";

export default function TestAvatarPage() {
  const { stream, initMedia, isInitializing, error } = useMediaStream();
  const [hasMediaInitialized, setHasMediaInitialized] = useState(false);
  const [mode, setMode] = useState<"none" | "avatar-face">("none");

  // ✅ Флаги для включения моделей
  const [enableFace, setEnableFace] = useState(true);
  const [enablePose, setEnablePose] = useState(false);
  const [enableHands, setEnableHands] = useState(false);

  const [currentBlendshapes, setCurrentBlendshapes] = useState<Array<{
    displayName: string;
    score: number;
  }> | null>(null);
  const [faceLandmarks, setFaceLandmarks] = useState<Array<{
    x: number;
    y: number;
    z: number;
  }> | null>(null);
  const [poseLandmarks, setPoseLandmarks] = useState<Array<{
    x: number;
    y: number;
    z: number;
  }> | null>(null);
  const [handLandmarks, setHandLandmarks] = useState<Array<
    Array<{ x: number; y: number; z: number }>
  > | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  const {
    isReady: isFaceReady,
    init: initFace,
    detect: detectFace,
    destroy: destroyFace,
  } = useMediaPipeFace();
  const {
    isReady: isPoseReady,
    init: initPose,
    detect: detectPose,
    destroy: destroyPose,
  } = useMediaPipePose();
  const {
    isReady: isHandsReady,
    init: initHands,
    detect: detectHands,
    destroy: destroyHands,
  } = useMediaPipeHands();
  const { yaw, pitch, roll } = useHeadRotation(faceLandmarks);
  const {
    mountRef,
    isLoaded,
    loadAvatar,
    applyEmotion,
    resetMorphs,
    applyHeadRotation,
    applyPose,
    applyHandPose,
  } = useThreeAvatar(AVATAR_PATH);

  // Применение анимаций
  useEffect(() => {
    if (mode === "avatar-face") {
      applyHeadRotation({ yaw, pitch, roll });
    }
  }, [yaw, pitch, roll, mode, applyHeadRotation]);

  useEffect(() => {
    if (mode === "avatar-face" && applyPose && poseLandmarks) {
      applyPose(poseLandmarks);
    }
  }, [poseLandmarks, mode, applyPose]);

  useEffect(() => {
    if (mode === "avatar-face" && applyHandPose && handLandmarks) {
      applyHandPose(handLandmarks);
    }
  }, [handLandmarks, mode, applyHandPose]);

  // Инициализация медиа
  useEffect(() => {
    if (!hasMediaInitialized) {
      initMedia({ video: true, audio: false }).finally(() =>
        setHasMediaInitialized(true)
      );
    }
  }, [initMedia, hasMediaInitialized]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream || null;
  }, [stream]);

  // Основной цикл
  useEffect(() => {
    if (mode === "none" || !stream || !isLoaded) return;

    const processFrame = (timestamp: number) => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) {
        requestAnimationFrame(processFrame);
        return;
      }

      // === Лицо ===
      if (enableFace && isFaceReady) {
        const faceResult = detectFace(video, timestamp);
        if (faceResult?.faceLandmarks?.[0]) {
          setFaceLandmarks(faceResult.faceLandmarks[0]);
        } else {
          setFaceLandmarks(null);
        }

        if (faceResult?.faceBlendshapes?.[0]?.categories) {
          const categories = faceResult.faceBlendshapes[0].categories;
          setCurrentBlendshapes([...categories]);
          applyEmotion(emotionMapping, categories);
        } else {
          setCurrentBlendshapes(null);
          resetMorphs();
        }
      }

      // === Поза (тело) ===
      if (enablePose && isPoseReady) {
        const poseResult = detectPose(video, timestamp);

        console.log("Pose result:", {
          hasPose: !!poseResult?.landmarks?.[0],
          numPoses: poseResult?.landmarks?.length || 0,
          landmarks: poseResult?.landmarks?.[0]?.slice(0, 5), // первые 5 точек
        });

        if (poseResult?.landmarks?.[0]) {
          setPoseLandmarks(poseResult.landmarks[0]);
        } else {
          setPoseLandmarks(null);
        }
      }

      // === Кисти (HandLandmarker) ===
      if (enableHands && isHandsReady) {
        const handResult = detectHands(video, timestamp);
        if (handResult?.landmarks && handResult.landmarks.length > 0) {
          setHandLandmarks(handResult.landmarks);
        } else {
          setHandLandmarks(null);
        }
      }

      requestAnimationFrame(processFrame);
    };

    requestAnimationFrame(processFrame);
    return () => resetMorphs();
  }, [
    mode,
    stream,
    isLoaded,
    enableFace,
    isFaceReady,
    detectFace,
    enablePose,
    isPoseReady,
    detectPose,
    enableHands,
    isHandsReady,
    detectHands,
    applyEmotion,
    resetMorphs,
  ]);

  // Загрузка зависимостей
  useEffect(() => {
    if (mode === "avatar-face") {
      if (enableFace && !isFaceReady) initFace();
      if (enablePose && !isPoseReady) initPose();
      if (enableHands && !isHandsReady) initHands();
      if (!isLoaded) loadAvatar();
    }
  }, [
    mode,
    enableFace,
    enablePose,
    enableHands,
    isFaceReady,
    isPoseReady,
    isHandsReady,
    isLoaded,
    initFace,
    initPose,
    initHands,
    loadAvatar,
  ]);

  // Очистка
  useEffect(() => {
    return () => {
      destroyFace();
      destroyPose();
      destroyHands?.();
    };
  }, [destroyFace, destroyPose, destroyHands]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Тест аватаров</h1>
      {error && <div className="text-red-500 mb-4">Ошибка: {error}</div>}
      {isInitializing && <div className="mb-4">Инициализация камеры...</div>}

      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setMode("none")}
          className={mode === "none" ? "bg-blue-600 text-white" : "bg-gray-200"}
        >
          Видео
        </button>
        <button
          onClick={() => setMode("avatar-face")}
          className={
            mode === "avatar-face" ? "bg-blue-600 text-white" : "bg-gray-200"
          }
        >
          Аватар + Лицо
        </button>
      </div>

      {/* Управление моделями */}
      <div className="mb-4 p-3 rounded">
        <h3 className="font-medium mb-2">Активные модели:</h3>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={enableFace}
              onChange={(e) => setEnableFace(e.target.checked)}
            />
            Лицо (эмоции + голова)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={enablePose}
              onChange={(e) => setEnablePose(e.target.checked)}
            />
            Поза (тело)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={enableHands}
              onChange={(e) => setEnableHands(e.target.checked)}
            />
            Кисти (детализация)
          </label>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/2">
          <h2 className="text-lg font-semibold mb-2">Камера</h2>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{ width: "100%", aspectRatio: "16/9" }}
          />
        </div>

        <div className="w-full md:w-1/2">
          <h2 className="text-lg font-semibold mb-2">Аватар</h2>
          <div
            ref={mountRef}
            style={{ width: "100%", height: "400px", background: "#1a1a1a" }}
          />
          {mode === "avatar-face" && currentBlendshapes && (
            <BlendshapeDebugger blendshapes={currentBlendshapes} />
          )}
        </div>
      </div>
    </div>
  );
}
