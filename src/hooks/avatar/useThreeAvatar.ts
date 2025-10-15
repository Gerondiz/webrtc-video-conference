// src/hooks/useThreeAvatar.ts
import { useState, useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';
import { EmotionMapItem } from '@/data/emotionMapping';
import type { HeadRotation } from '@/hooks/avatar/useHeadRotation';

export const useThreeAvatar = (avatarPath: string) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const avatarRef = useRef<THREE.Object3D | null>(null);
    const animationFrameRef = useRef<number>(0);

    // Кости
    const headBoneRef = useRef<THREE.Bone | null>(null);
    const leftUpperArmBoneRef = useRef<THREE.Bone | null>(null);
    const leftLowerArmBoneRef = useRef<THREE.Bone | null>(null);
    const leftHandBoneRef = useRef<THREE.Bone | null>(null);
    const rightUpperArmBoneRef = useRef<THREE.Bone | null>(null);
    const rightLowerArmBoneRef = useRef<THREE.Bone | null>(null);
    const rightHandBoneRef = useRef<THREE.Bone | null>(null);

    const [isLoaded, setIsLoaded] = useState(false);

    // Инициализация сцены
    useEffect(() => {
        if (!mountRef.current) return;

        const container = mountRef.current;
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a1a);

        const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
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
        if (!sceneRef.current || avatarRef.current || isLoaded) return;

        try {
            const loader = new GLTFLoader();
            const gltf = await loader.loadAsync(avatarPath);

            const avatar = gltf.scene;
            avatar.scale.set(0.8, 0.8, 0.8);
            avatar.position.y = -1.2;
            avatar.rotation.y = Math.PI; // смотрит в камеру
            avatar.position.z = 0.8;
            sceneRef.current.add(avatar);
            avatarRef.current = avatar;
            setIsLoaded(true);



            // Поиск костей
            avatar.traverse((child) => {
                if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
                    const skinnedMesh = child as THREE.SkinnedMesh;
                    const bones = skinnedMesh.skeleton.bones;

                    headBoneRef.current = bones.find(b => b.name === 'J_Bip_C_Head') || null;
                    leftUpperArmBoneRef.current = bones.find(b => b.name === 'J_Bip_L_UpperArm') || null;
                    leftLowerArmBoneRef.current = bones.find(b => b.name === 'J_Bip_L_LowerArm') || null;
                    leftHandBoneRef.current = bones.find(b => b.name === 'J_Bip_L_Hand') || null;
                    rightUpperArmBoneRef.current = bones.find(b => b.name === 'J_Bip_R_UpperArm') || null;
                    rightLowerArmBoneRef.current = bones.find(b => b.name === 'J_Bip_R_LowerArm') || null;
                    rightHandBoneRef.current = bones.find(b => b.name === 'J_Bip_R_Hand') || null;
                }
            });
        } catch (err) {
            console.error('Failed to load avatar:', err);
        }
    }, [avatarPath, isLoaded]);

    // Применение морфов (эмоции)
    const applyEmotion = useCallback((emotionMapping: EmotionMapItem[], categories: Array<{ score: number }>) => {
        if (!avatarRef.current) return;

        avatarRef.current.traverse(child => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                if (!mesh.morphTargetInfluences || !mesh.morphTargetDictionary) return;

                mesh.morphTargetInfluences.fill(0);

                let bestEmotion: EmotionMapItem | null = null;
                let maxScore = 0;

                emotionMapping.forEach(emotion => {
                    const score = categories[emotion.mediaPipeIndex]?.score || 0;
                    if (score > maxScore && score > 0.5) {
                        maxScore = score;
                        bestEmotion = emotion;
                    }
                });

                if (bestEmotion) {
                    const morphIndex = mesh.morphTargetDictionary[bestEmotion["morphName"]];
                    if (morphIndex !== undefined && morphIndex < mesh.morphTargetInfluences.length) {
                        const intensity = bestEmotion["intensity"] ?? 2.0;
                        mesh.morphTargetInfluences[morphIndex] = Math.min(maxScore * intensity, 1);
                    }
                }
            }
        });
    }, []);

    const resetMorphs = useCallback(() => {
        avatarRef.current?.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                if (mesh.morphTargetInfluences) {
                    mesh.morphTargetInfluences.fill(0);
                }
            }
        });
    }, []);

    // Поворот головы
    const applyHeadRotation = useCallback((rotation: HeadRotation) => {
        if (!headBoneRef.current) return;
        headBoneRef.current.rotation.set(
            rotation.pitch * Math.PI * 0.2,
            rotation.yaw * Math.PI * 0.3,
            rotation.roll * Math.PI * 0.2
        );
    }, []);

    // Анимация позы (тело: плечи + локти)
    const applyPose = useCallback((poseLandmarks: Array<{ x: number; y: number; z: number }> | null) => {
        if (!poseLandmarks || poseLandmarks.length < 33) return;

        const leftShoulder = poseLandmarks[11];
        const leftElbow = poseLandmarks[13];
        const rightShoulder = poseLandmarks[12];
        const rightElbow = poseLandmarks[14];

        // Левая рука
        if (leftUpperArmBoneRef.current) {
            leftUpperArmBoneRef.current.rotation.z = (leftShoulder.y - 0.5) * Math.PI * 0.6;
        }
        if (leftLowerArmBoneRef.current) {
            const elbowBend = Math.max(0, leftShoulder.y - leftElbow.y) * 2;
            leftLowerArmBoneRef.current.rotation.x = Math.min(elbowBend, 1.2);
        }

        // Правая рука
        if (rightUpperArmBoneRef.current) {
            rightUpperArmBoneRef.current.rotation.z = (rightShoulder.y - 0.5) * Math.PI * 0.6;
        }
        if (rightLowerArmBoneRef.current) {
            const elbowBend = Math.max(0, rightShoulder.y - rightElbow.y) * 2;
            rightLowerArmBoneRef.current.rotation.x = Math.min(elbowBend, 1.2);
        }
    }, []);

    // Анимация кистей (HandLandmarker)
    const applyHandPose = useCallback((handLandmarks: Array<Array<{ x: number; y: number; z: number }>> | null) => {
        if (!handLandmarks) return;

        // Левая кисть
        if (handLandmarks[0] && leftHandBoneRef.current) {
            const wrist = handLandmarks[0][0];
            leftHandBoneRef.current.rotation.x = (wrist.y - 0.5) * Math.PI * 0.5;
        }

        // Правая кисть
        if (handLandmarks[1] && rightHandBoneRef.current) {
            const wrist = handLandmarks[1][0];
            rightHandBoneRef.current.rotation.x = (wrist.y - 0.5) * Math.PI * 0.5;
        }
    }, []);

    return {
        mountRef,
        isLoaded,
        loadAvatar,
        applyEmotion,
        resetMorphs,
        applyHeadRotation,
        applyPose,
        applyHandPose,
    };
};