// src/contexts/MediaStreamContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { checkMediaDevices as checkMediaDevicesUtil } from '@/lib/utils';
import { MediaDevicesStatus } from '@/types';

interface MediaStreamContextType {
  localStream: MediaStream | null;
  devicesStatus: MediaDevicesStatus;
  isInitializing: boolean;
  mediaError: string | null;
  initMedia: () => Promise<void>;
  reinitMedia: (deviceIds?: { video?: string; audio?: string }) => Promise<void>;
}

const MediaStreamContext = createContext<MediaStreamContextType>({
  localStream: null,
  devicesStatus: {
    hasCamera: false,
    hasMicrophone: false
  },
  isInitializing: true,
  mediaError: null,
  initMedia: async () => {},
  reinitMedia: async () => {}
});

export const MediaStreamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [devicesStatus, setDevicesStatus] = useState<MediaDevicesStatus>({
    hasCamera: false,
    hasMicrophone: false
  });
  const [isInitializing, setIsInitializing] = useState(true);
  0
  const [mediaError, setMediaError] = useState<string | null>(null);

  // Инициализация медиаустройств
  const initMedia = useCallback(async () => {
    setIsInitializing(true);
    setMediaError(null);
    
    try {
      // Проверяем доступные устройства
      const status = await checkMediaDevicesUtil();
      setDevicesStatus(status);
      
      // Если есть устройства, запрашиваем доступ
      if (status.hasCamera || status.hasMicrophone) {
        const constraints: MediaStreamConstraints = {
          video: status.hasCamera,
          audio: status.hasMicrophone
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        setLocalStream(stream);
      }
    } catch (error) {
      console.error('Error initializing media:', error);
      setMediaError('Could not access camera or microphone. Please check permissions.');
    } finally {
      setIsInitializing(false);
    }
  }, []);

  // Перезапуск медиа с выбором устройств
  const reinitMedia = useCallback(async (deviceIds?: { video?: string; audio?: string }) => {
    setIsInitializing(true);
    setMediaError(null);
    
    try {
      // Останавливаем текущий поток
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
      }
      
      // Проверяем доступные устройства
      const status = await checkMediaDevicesUtil();
      setDevicesStatus(status);
      
      // Если есть устройства, запрашиваем доступ с выбранными ID
      if (status.hasCamera || status.hasMicrophone) {
        const constraints: MediaStreamConstraints = {
          video: deviceIds?.video ? { deviceId: { exact: deviceIds.video } } : status.hasCamera,
          audio: deviceIds?.audio ? { deviceId: { exact: deviceIds.audio } } : status.hasMicrophone
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        setLocalStream(stream);
      }
    } catch (error) {
      console.error('Error reinitializing media:', error);
      setMediaError('Failed to access selected devices');
    } finally {
      setIsInitializing(false);
    }
  }, [localStream]);

  // Инициализируем медиа при монтировании
  useEffect(() => {
    initMedia();
    
    // Очистка при размонтировании
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [initMedia]);

  return (
    <MediaStreamContext.Provider value={{
      localStream,
      devicesStatus,
      isInitializing,
      mediaError,
      initMedia,
      reinitMedia
    }}>
      {children}
    </MediaStreamContext.Provider>
  );
};

export const useMediaStream = () => useContext(MediaStreamContext);