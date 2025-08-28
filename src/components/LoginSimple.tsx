// src/components/Login.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isCheckingServer, setIsCheckingServer] = useState(false);
  const [serverStatus, setServerStatus] = useState<string | null>(null);
  const router = useRouter();

  // Функция для создания комнаты
  const handleCreateRoom = async () => {
    if (!username.trim()) {
      alert('Please enter a username');
      return;
    }

    try {
      const response = await fetch('/api/create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      if (response.ok) {
        const { roomId } = await response.json();
        router.push(`/room/${roomId}?username=${encodeURIComponent(username)}`);
      } else {
        alert('Failed to create room');
      }
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Error creating room');
    }
  };

  // Функция для присоединения к комнате
  const handleJoinRoom = async () => {
    if (!username.trim() || !roomId.trim()) {
      alert('Please enter both username and room ID');
      return;
    }

    try {
      const response = await fetch('/api/join-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, username }),
      });

      if (response.ok) {
        router.push(`/room/${roomId}?username=${encodeURIComponent(username)}`);
      } else {
        alert('Room not found or invalid');
      }
    } catch (error) {
      console.error('Error joining room:', error);
      alert('Error joining room');
    }
  };

  // Функция для проверки сигнального сервера
  const checkSignalingServer = async () => {
    setIsCheckingServer(true);
    setServerStatus(null);

    try {
      const response = await fetch('/api/check-signaling-server');
      const data = await response.json();

      if (response.ok) {
        setServerStatus(data.message || 'Signaling server is working');
      } else {
        setServerStatus(data.error || 'Signaling server check failed');
      }
    } catch (error) {
      console.error('Error checking signaling server:', error);
      setServerStatus('Error connecting to signaling server');
    } finally {
      setIsCheckingServer(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">WebRTC Video Conference</h1>

        {/* Username Input */}
        <div className="mb-4">
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
            Your Name
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your name"
            className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Create Room Button */}
        <button
          onClick={handleCreateRoom}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded hover:bg-blue-700 transition-colors"
          disabled={!username.trim()}
        >
          Create New Room
        </button>

        {/* Separator */}
        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-4 text-gray-600">or</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        {/* Room ID Input */}
        <div className="mb-4">
          <label htmlFor="roomId" className="block text-sm font-medium text-gray-700 mb-2">
            Room ID
          </label>
          <input
            id="roomId"
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value.toUpperCase())}
            placeholder="Enter room ID"
            className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Join Room Button */}
        <button
          onClick={handleJoinRoom}
          className="w-full bg-green-600 text-white py-3 px-4 rounded hover:bg-green-700 transition-colors"
          disabled={!username.trim() || !roomId.trim()}
        >
          Join Existing Room
        </button>

        {/* Check Signaling Server Button */}
        <div className="mt-6 text-center">
          <button
            onClick={checkSignalingServer}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            disabled={isCheckingServer}
          >
            {isCheckingServer ? 'Checking...' : 'Check Signaling Server'}
          </button>
          {serverStatus && (
            <p className={`mt-2 ${serverStatus.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
              {serverStatus}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}