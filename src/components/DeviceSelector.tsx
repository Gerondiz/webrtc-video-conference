// src/components/DeviceSelector.tsx
'use client';

import { useState, useEffect } from 'react';
import { checkMediaPermissions } from '@/lib/utils';

interface DeviceSelectorProps {
  onDevicesSelected: (deviceIds: { video: string; audio: string }) => void;
  onCancel: () => void;
}

interface Devices {
  audioInputs: MediaDeviceInfo[];
  videoInputs: MediaDeviceInfo[];
}

export default function DeviceSelector({ onDevicesSelected, onCancel }: DeviceSelectorProps) {
  const [devices, setDevices] = useState<Devices>({
    audioInputs: [],
    videoInputs: []
  });
  const [selectedAudio, setSelectedAudio] = useState<string>('');
  const [selectedVideo, setSelectedVideo] = useState<string>('');
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<{ camera: boolean; microphone: boolean }>({
    camera: false,
    microphone: false
  });

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        
        // Проверяем разрешения
        const mediaPermissions = await checkMediaPermissions();
        setPermissions(mediaPermissions);
        
        if (!mediaPermissions.camera && !mediaPermissions.microphone) {
          setError('Need camera and microphone permissions');
          setLoading(false);
          return;
        }
        
        setPermissionGranted(true);
        
        // Получаем список устройств
        const mediaDevices = await navigator.mediaDevices.enumerateDevices();
        
        const audioInputs = mediaDevices.filter(device => 
          device.kind === 'audioinput' && device.deviceId !== ''
        );
        const videoInputs = mediaDevices.filter(device => 
          device.kind === 'videoinput' && device.deviceId !== ''
        );
        
        setDevices({ audioInputs, videoInputs });
        
        // Устанавливаем устройства по умолчанию
        if (audioInputs.length > 0 && mediaPermissions.microphone) {
          setSelectedAudio(audioInputs[0].deviceId);
        }
        
        if (videoInputs.length > 0 && mediaPermissions.camera) {
          setSelectedVideo(videoInputs[0].deviceId);
        }
      } catch (err) {
        console.error('Error initializing devices:', err);
        setError('Failed to access media devices');
      } finally {
        setLoading(false);
      }
    };
    
    initialize();
  }, []);

  const handleConfirm = () => {
    onDevicesSelected({
      video: selectedVideo,
      audio: selectedAudio
    });
  };

  const requestPermission = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Запрашиваем полный доступ
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: true 
      });
      
      // Останавливаем поток
      stream.getTracks().forEach(track => track.stop());
      
      setPermissionGranted(true);
      
      // Обновляем список устройств
      const mediaDevices = await navigator.mediaDevices.enumerateDevices();
      
      const audioInputs = mediaDevices.filter(device => 
        device.kind === 'audioinput' && device.deviceId !== ''
      );
      const videoInputs = mediaDevices.filter(device => 
        device.kind === 'videoinput' && device.deviceId !== ''
      );
      
      setDevices({ audioInputs, videoInputs });
      
      // Устанавливаем устройства по умолчанию
      if (audioInputs.length > 0) {
        setSelectedAudio(audioInputs[0].deviceId);
      }
      
      if (videoInputs.length > 0) {
        setSelectedVideo(videoInputs[0].deviceId);
      }
    } catch (err) {
      console.error('Error requesting permission:', err);
      setError('Failed to get permission. Please allow access to camera and microphone.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Loading devices...</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded mb-2"></div>
          <div className="h-4 bg-gray-300 rounded mb-2"></div>
          <div className="h-4 bg-gray-300 rounded mb-2"></div>
        </div>
      </div>
    );
  }

  if (!permissionGranted) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Permission Required</h3>
        <p className="mb-4">We need access to your camera and microphone to continue.</p>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="flex space-x-2">
          <button 
            onClick={requestPermission}
            className="flex-1 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            Grant Permission
          </button>
          <button 
            onClick={onCancel}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Select Devices</h3>
      
      {error && <p className="text-red-500 mb-4">{error}</p>}
      
      {permissions.camera && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Camera:</label>
          <select 
            value={selectedVideo} 
            onChange={(e) => setSelectedVideo(e.target.value)}
            className="w-full p-2 border rounded"
          >
            {devices.videoInputs.map(device => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${device.deviceId.slice(0, 5)}...`}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {permissions.microphone && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Microphone:</label>
          <select 
            value={selectedAudio} 
            onChange={(e) => setSelectedAudio(e.target.value)}
            className="w-full p-2 border rounded"
          >
            {devices.audioInputs.map(device => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Microphone ${device.deviceId.slice(0, 5)}...`}
              </option>
            ))}
          </select>
        </div>
      )}
      
      <div className="flex space-x-2">
        <button 
          onClick={handleConfirm}
          className="flex-1 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          Confirm
        </button>
        <button 
          onClick={onCancel}
          className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}