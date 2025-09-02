// src/components/RoomPage/DeviceSelector.tsx
'use client';
import { useState, useEffect } from 'react';
import { MediaDeviceInfo } from '@/types';

interface DeviceSelectorProps {
  onDevicesSelected: (devices: { video: string; audio: string }) => void;
  onCancel: () => void;
}

export default function DeviceSelector({ onDevicesSelected, onCancel }: DeviceSelectorProps) {
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState('');
  const [selectedAudio, setSelectedAudio] = useState('');

  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        setVideoDevices(devices.filter((d) => d.kind === 'videoinput'));
        setAudioDevices(devices.filter((d) => d.kind === 'audioinput'));

        if (devices.length > 0) {
          setSelectedVideo(devices.find((d) => d.kind === 'videoinput')?.deviceId || '');
          setSelectedAudio(devices.find((d) => d.kind === 'audioinput')?.deviceId || '');
        }
      } catch (error) {
        console.error('Error enumerating devices:', error);
      }
    };

    getDevices();
  }, []);

  const handleConfirm = () => {
    onDevicesSelected({
      video: selectedVideo,
      audio: selectedAudio,
    });
  };

  return (
    <div className="text-white">
      <h3 className="text-lg font-semibold mb-4">Select Devices</h3>
      <div className="mb-4">
        <label className="block mb-2">Camera:</label>
        <select
          value={selectedVideo}
          onChange={(e) => setSelectedVideo(e.target.value)}
          className="w-full p-2 bg-gray-700 rounded"
        >
          {videoDevices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Camera ${videoDevices.indexOf(device) + 1}`}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-6">
        <label className="block mb-2">Microphone:</label>
        <select
          value={selectedAudio}
          onChange={(e) => setSelectedAudio(e.target.value)}
          className="w-full p-2 bg-gray-700 rounded"
        >
          {audioDevices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Microphone ${audioDevices.indexOf(device) + 1}`}
            </option>
          ))}
        </select>
      </div>
      <div className="flex justify-end space-x-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500"
        >
          Confirm
        </button>
      </div>
    </div>
  );
}