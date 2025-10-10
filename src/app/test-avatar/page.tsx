"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useMediaStream } from "@/contexts/MediaStreamContext";
import * as THREE from "three";
import { GLTFLoader } from "three-stdlib";
import {
  FaceLandmarker,
  HandLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision";

type AvatarMode = "none" | "avatar-static" | "avatar-face" | "avatar-full";

const AVATAR_PATH = "/models/Anime_School_Teacher.GLB";

export default function TestAvatarPage() {
  const { stream, initMedia, isInitializing, error } = useMediaStream();
  const [mode, setMode] = useState<AvatarMode>("none");

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const avatarRef = useRef<THREE.Object3D | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);

  // MediaPipe refs
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameRef = useRef<number>(0);

  // Инициализация камеры при монтировании
  useEffect(() => {
    initMedia({ video: true, audio: false });
  }, [initMedia]);

  // Инициализация Three.js сцены
  useEffect(() => {
    if (!mountRef.current) return;

    const { current: container } = mountRef;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 2;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      if (mixerRef.current) mixerRef.current.update(0.016); // ~60fps
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current || !mountRef.current)
        return;
      cameraRef.current.aspect =
        mountRef.current.clientWidth / mountRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(
        mountRef.current.clientWidth,
        mountRef.current.clientHeight
      );
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameRef.current);
      if (rendererRef.current?.domElement?.parentElement) {
        rendererRef.current.domElement.parentElement.removeChild(
          rendererRef.current.domElement
        );
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
      avatar.position.y = -0.5;

      sceneRef.current.add(avatar);
      avatarRef.current = avatar;

      if (gltf.animations.length > 0) {
        mixerRef.current = new THREE.AnimationMixer(avatar);
      }
    } catch (err) {
      console.error("Failed to load avatar:", err);
    }
  }, []);

  // Инициализация MediaPipe Face Landmarker
  const initFaceLandmarker = useCallback(async () => {
    if (faceLandmarkerRef.current) return;

    try {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      const faceLandmarker = await FaceLandmarker.createFromOptions(
        filesetResolver, // ← 1-й аргумент: wasmFileset
        {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task",
            delegate: "GPU",
          },
          outputFaceBlendshapes: true,
          runningMode: "VIDEO",
        } // ← 2-й аргумент: options
      );

      faceLandmarkerRef.current = faceLandmarker;
    } catch (err) {
      console.error("Failed to initialize Face Landmarker:", err);
    }
  }, []);

  // Инициализация MediaPipe Hand Landmarker
  const initHandLandmarker = useCallback(async () => {
    if (handLandmarkerRef.current) return;

    try {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      const handLandmarker = await HandLandmarker.createFromOptions(
        filesetResolver,
        {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task",
            delegate: "GPU",
          },
          numHands: 2,
          runningMode: "VIDEO",
        }
      );

      handLandmarkerRef.current = handLandmarker;
    } catch (err) {
      console.error("Failed to initialize Hand Landmarker:", err);
    }
  }, []);

  // Основной цикл обработки кадров
  useEffect(() => {
    if (mode === "none" || !videoRef.current || !stream) return;

    // Загружаем аватар при первом входе в режим с аватаром
    if (mode !== "avatar-face" && !avatarRef.current) {
      loadAvatar();
    }

    // Инициализируем трекеры при необходимости
    if (mode === "avatar-face" || mode === "avatar-full") {
      initFaceLandmarker();
    }
    if (mode === "avatar-full") {
      initHandLandmarker();
    }

    const processFrame = (timestamp: number) => {
      if (!videoRef.current) return;

      // Face Landmarker
      if (
        (mode === "avatar-face" || mode === "avatar-full") &&
        faceLandmarkerRef.current
      ) {
        const faces = faceLandmarkerRef.current.detectForVideo(
          videoRef.current,
          timestamp
        );
        if (faces.faceLandmarks.length > 0 && faces.faceBlendshapes?.[0]) {
          const blendshapes = faces.faceBlendshapes[0].categories;
          const mouthOpen =
            blendshapes.find((b) => b.displayName === "mouthOpen")?.score || 0;

          // Применяем к морф-таргетам (если они есть)
          avatarRef.current?.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              if (mesh.morphTargetInfluences) {
                // Предположим, что морф "mouthOpen" — первый
                mesh.morphTargetInfluences[0] = Math.min(mouthOpen * 2, 1); // усиливаем эффект
              }
            }
          });
        }
      }

      // Hand Landmarker (упрощённо — только факт обнаружения)
      if (mode === "avatar-full" && handLandmarkerRef.current) {
        const hands = handLandmarkerRef.current.detectForVideo(
          videoRef.current,
          timestamp
        );
        // Здесь можно добавить логику анимации рук
        if (hands.landmarks.length > 0) {
          console.log("Рука обнаружена, точек:", hands.landmarks[0].length);
          // TODO: анимировать кости рук
        }
      }

      animationFrameRef.current = requestAnimationFrame(processFrame);
    };

    animationFrameRef.current = requestAnimationFrame(processFrame);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [mode, stream, loadAvatar, initFaceLandmarker, initHandLandmarker]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (faceLandmarkerRef.current) {
        faceLandmarkerRef.current.close();
      }
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
      }
    };
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Тест аватаров</h1>

      {error && <div className="text-red-500 mb-4">Ошибка: {error}</div>}
      {isInitializing && <div className="mb-4">Инициализация камеры...</div>}

      {/* Управление режимами */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(
          [
            "none",
            "avatar-static",
            "avatar-face",
            "avatar-full",
          ] as AvatarMode[]
        ).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-2 rounded ${
              mode === m
                ? "bg-blue-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            {m === "none" && "Видео"}
            {m === "avatar-static" && "Аватар (статичный)"}
            {m === "avatar-face" && "Аватар + Лицо"}
            {m === "avatar-full" && "Аватар + Лицо+Руки"}
          </button>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Видео (всегда скрыто в режимах аватара, но нужно для MediaPipe) */}
        <div className="w-full md:w-1/2">
          <h2 className="text-lg font-semibold mb-2">Источник видео</h2>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{
              display: mode === "none" ? "block" : "none",
              width: "100%",
              aspectRatio: "16/9",
            }}
          />
          {mode !== "none" && (
            <div className="text-sm text-gray-500 italic">
              Видео скрыто (используется для анализа)
            </div>
          )}
        </div>

        {/* 3D сцена */}
        <div className="w-full md:w-1/2">
          <h2 className="text-lg font-semibold mb-2">Аватар</h2>
          <div
            ref={mountRef}
            style={{ width: "100%", height: "400px", background: "#1a1a1a" }}
          />
          {mode === "none" && (
            <div className="text-gray-500">Выберите режим аватара</div>
          )}
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-600">
        <p>
          • Убедитесь, что файл <code>{AVATAR_PATH}</code> существует в папке{" "}
          <code>public/models/</code>
        </p>
        <p>
          • Для режимов с трекингом требуется поддержка WebGL и достаточно
          мощный GPU
        </p>
      </div>
    </div>
  );
}
