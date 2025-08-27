'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateUsername } from '@/lib/utils';

export default function HomePage() {
  const [username, setUsername] = useState(generateUsername());
  const [roomId, setRoomId] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const router = useRouter();

  const handleCreateRoom = async () => {
    setIsCreatingRoom(true);
    try {
      const response = await fetch('http://localhost:8000/api/create-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        router.push(`/room/${data.roomId}?username=${username}`);
      } else {
        alert('Failed to create room');
      }
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Error creating room');
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleJoinRoom = () => {
    if (!roomId.trim()) {
      alert('Please enter a room ID');
      return;
    }
    
    setIsJoiningRoom(true);
    // Проверяем существование комнаты
    fetch('http://localhost:8000/api/join-room', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ roomId, username }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          router.push(`/room/${roomId}?username=${username}`);
        } else {
          alert('Room not found or invalid');
        }
      })
      .catch(error => {
        console.error('Error joining room:', error);
        alert('Error joining room');
      })
      .finally(() => {
        setIsJoiningRoom(false);
      });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          WebRTC Video Conference
        </h1>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Name
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your name"
          />
        </div>
        
        <div className="space-y-4">
          <button
            onClick={handleCreateRoom}
            disabled={isCreatingRoom}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
          >
            {isCreatingRoom ? 'Creating Room...' : 'Create New Room'}
          </button>
          
          <div className="relative flex items-center my-6">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink mx-4 text-gray-600">or</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room ID
            </label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
              placeholder="Enter room ID"
            />
          </div>
          
          <button
            onClick={handleJoinRoom}
            disabled={isJoiningRoom}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
          >
            {isJoiningRoom ? 'Joining Room...' : 'Join Existing Room'}
          </button>
        </div>
        
        <p className="text-center text-gray-500 text-sm mt-6">
          Start or join a video conference room to connect with others
        </p>
      </div>
    </div>
  );
}