// contexts/MediaStreamContext.tsx
'use client';
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { MediaDevicesStatus } from '@/types';
import { checkMediaDevices, getMediaDevicesWithPermissions } from '@/lib/utils';

interface MediaStreamContextType {
  stream: MediaStream | null;
  devicesStatus: MediaDevicesStatus;
  initMedia: () => Promise<void>;
  stopMediaStream: () => void;
  isInitializing: boolean;
  error: string | null;
  hasAttemptedInitialization: boolean;
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

  const initMedia = useCallback(async () => {
    // Если уже инициализируемся или уже пытались и не получилось, не повторяем
    if (isInitializing || (hasAttemptedInitialization && !stream)) {
      return;
    }
    
    setIsInitializing(true);
    setError(null);
    
    try {
      const status = await checkMediaDevices();
      setDevicesStatus(status);
      
      // Если нет устройств, не пытаемся получить доступ
      if (!status.hasCamera && !status.hasMicrophone) {
        setError('No media devices found');
        setHasAttemptedInitialization(true);
        return;
      }
      
      const mediaStream = await getMediaDevicesWithPermissions(status);
      setStream(mediaStream);
      setHasAttemptedInitialization(true);
    } catch (err) {
      setError('Failed to access media devices');
      console.error('Media initialization error:', err);
      setHasAttemptedInitialization(true);
    } finally {
      setIsInitializing(false);
    }
  }, [isInitializing, hasAttemptedInitialization, stream]);

  const stopMediaStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
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