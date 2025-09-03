// contexts/MediaStreamContext.tsx
'use client';
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { MediaDevicesStatus } from '@/types';
import { checkMediaDevices, getMediaDevicesWithPermissions } from '@/lib/utils';

interface MediaStreamContextType {
  stream: MediaStream | null;
  devicesStatus: MediaDevicesStatus;
  initMedia: (constraints?: MediaStreamConstraints) => Promise<void>;
  stopMediaStream: () => void;
  isInitializing: boolean;
  error: string | null;
  hasAttemptedInitialization: boolean;
  updateStreamConstraints: (constraints: MediaStreamConstraints) => Promise<void>;
  toggleAudio: () => void;
  toggleVideo: () => void;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
}

const MediaStreamContext = createContext<MediaStreamContextType | undefined>(undefined);

export const MediaStreamProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [devicesStatus, setDevicesStatus] = useState<MediaDevicesStatus>({
    hasCamera: false,
    hasMicrophone: false,
  });
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAttemptedInitialization, setHasAttemptedInitialization] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  const initMedia = useCallback(async (constraints?: MediaStreamConstraints): Promise<void> => {
    // Если уже инициализируемся, не повторяем
    if (isInitializing) {
      return;
    }
    
    setIsInitializing(true);
    setError(null);
    
    try {
      // Проверяем доступные устройства
      const status = await checkMediaDevices();
      setDevicesStatus(status);
      
      // Если нет устройств, не пытаемся получить доступ
      if (!status.hasCamera && !status.hasMicrophone) {
        setError('No media devices found');
        setHasAttemptedInitialization(true);
        return;
      }
      
      // Используем переданные constraints или стандартные на основе доступных устройств
      const mediaConstraints = constraints || {
        video: status.hasCamera,
        audio: status.hasMicrophone,
      };
      
      const mediaStream = await getMediaDevicesWithPermissions(mediaConstraints);
      setStream(mediaStream);
      setHasAttemptedInitialization(true);
      
      // Устанавливаем начальные состояния аудио/видео
      if (mediaStream) {
        setIsAudioEnabled(mediaStream.getAudioTracks().some(track => track.enabled));
        setIsVideoEnabled(mediaStream.getVideoTracks().some(track => track.enabled));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access media devices';
      setError(errorMessage);
      console.error('Media initialization error:', err);
      setHasAttemptedInitialization(true);
    } finally {
      setIsInitializing(false);
    }
  }, [isInitializing]);

  const stopMediaStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsAudioEnabled(false);
      setIsVideoEnabled(false);
    }
  }, [stream]);

  const updateStreamConstraints = useCallback(async (constraints: MediaStreamConstraints): Promise<void> => {
    // Останавливаем текущий поток
    if (stream) {
      stopMediaStream();
    }
    
    // Создаем новый поток с новыми constraints
    await initMedia(constraints);
  }, [stream, stopMediaStream, initMedia]);

  const toggleAudio = useCallback(() => {
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsAudioEnabled(prev => !prev);
    }
  }, [stream]);

  const toggleVideo = useCallback(() => {
    if (stream) {
      const videoTracks = stream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(prev => !prev);
    }
  }, [stream]);

  return (
    <MediaStreamContext.Provider
      value={{
        stream,
        devicesStatus,
        initMedia,
        stopMediaStream,
        isInitializing,
        error,
        hasAttemptedInitialization,
        updateStreamConstraints,
        toggleAudio,
        toggleVideo,
        isAudioEnabled,
        isVideoEnabled,
      }}
    >
      {children}
    </MediaStreamContext.Provider>
  );
};

export const useMediaStream = () => {
  const context = useContext(MediaStreamContext);
  if (!context) {
    throw new Error('useMediaStream must be used within a MediaStreamProvider');
  }
  return context;
};