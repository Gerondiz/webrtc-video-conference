// contexts/MediaStreamContext.tsx
'use client';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
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

  // ✅ Восстанавливаем состояние из sessionStorage при запуске
  useEffect(() => {
    const savedAudio = sessionStorage.getItem('isAudioEnabled');
    const savedVideo = sessionStorage.getItem('isVideoEnabled');

    if (savedAudio !== null) {
      setIsAudioEnabled(JSON.parse(savedAudio));
    }
    if (savedVideo !== null) {
      setIsVideoEnabled(JSON.parse(savedVideo));
    }
  }, []);

  const initMedia = useCallback(async (constraints?: MediaStreamConstraints): Promise<void> => {
    if (isInitializing) {
      return;
    }
    
    setIsInitializing(true);
    setError(null);
    
    try {
      const status = await checkMediaDevices();
      setDevicesStatus(status);
      
      if (!status.hasCamera && !status.hasMicrophone) {
        setError('No media devices found');
        setHasAttemptedInitialization(true);
        return;
      }
      
      const mediaConstraints = constraints || {
        video: status.hasCamera,
        audio: status.hasMicrophone,
      };
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      const mediaStream = await getMediaDevicesWithPermissions(mediaConstraints);
      setStream(mediaStream);
      setHasAttemptedInitialization(true);
      
      if (mediaStream) {
        // ✅ Применяем сохранённое состояние к трекам
        const audioTracks = mediaStream.getAudioTracks();
        const videoTracks = mediaStream.getVideoTracks();

        audioTracks.forEach(track => {
          track.enabled = JSON.parse(sessionStorage.getItem('isAudioEnabled') || 'true');
        });
        videoTracks.forEach(track => {
          track.enabled = JSON.parse(sessionStorage.getItem('isVideoEnabled') || 'true');
        });

        setIsAudioEnabled(audioTracks.some(track => track.enabled));
        setIsVideoEnabled(videoTracks.some(track => track.enabled));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access media devices';
      setError(errorMessage);
      console.error('Media initialization error:', err);
      setHasAttemptedInitialization(true);
    } finally {
      setIsInitializing(false);
    }
  }, [isInitializing, stream]);

  const stopMediaStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      
      setStream(null);
      setIsAudioEnabled(false);
      setIsVideoEnabled(false);
      setHasAttemptedInitialization(false);

      // ✅ Очищаем sessionStorage при остановке
      sessionStorage.removeItem('isAudioEnabled');
      sessionStorage.removeItem('isVideoEnabled');
    }
  }, [stream]);

  const updateStreamConstraints = useCallback(async (constraints: MediaStreamConstraints): Promise<void> => {
    if (stream) {
      stopMediaStream();
    }
    
    await initMedia(constraints);
  }, [stream, stopMediaStream, initMedia]);

  const toggleAudio = useCallback(() => {
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      const newEnabled = !isAudioEnabled;
      setIsAudioEnabled(newEnabled);

      // ✅ Сохраняем новое состояние в sessionStorage
      sessionStorage.setItem('isAudioEnabled', JSON.stringify(newEnabled));
    }
  }, [stream, isAudioEnabled]);

  const toggleVideo = useCallback(() => {
    if (stream) {
      const videoTracks = stream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      const newEnabled = !isVideoEnabled;
      setIsVideoEnabled(newEnabled);

      // ✅ Сохраняем новое состояние в sessionStorage
      sessionStorage.setItem('isVideoEnabled', JSON.stringify(newEnabled));
    }
  }, [stream, isVideoEnabled]);

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