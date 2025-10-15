// src/hooks/useHeadRotation.ts
import { useMemo } from 'react';

export interface HeadRotation {
  yaw: number;   // -1..1 (влево/вправо)
  pitch: number; // -1..1 (вниз/вверх)
  roll: number;  // -1..1 (наклон вбок)
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export const useHeadRotation = (
  landmarks: Array<{ x: number; y: number; z: number }> | null
): HeadRotation => {
  return useMemo(() => {
    if (!landmarks || landmarks.length < 468) {
      return { yaw: 0, pitch: 0, roll: 0 };
    }

    const nose = landmarks[1];
    const leftEye = landmarks[263];
    const rightEye = landmarks[33];

    // Yaw: поворот головы
    const yaw = (nose.x - (leftEye.x + rightEye.x) / 2) * 2.0;

    // Pitch: наклон вперёд/назад (инвертируем Y)
    const pitch = -(nose.y - (leftEye.y + rightEye.y) / 2) * 3.0;

    // Roll: наклон вбок
    const roll = (leftEye.y - rightEye.y) * 4.0;

    return {
      yaw: clamp(yaw, -1, 1),
      pitch: clamp(pitch, -1, 1),
      roll: clamp(roll, -1, 1),
    };
  }, [landmarks]);
};