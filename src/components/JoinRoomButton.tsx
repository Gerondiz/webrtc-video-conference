// src/components/JoinRoomButton.tsx
'use client';

import { useState } from 'react';

interface JoinRoomButtonProps {
  roomId: string;
  username: string;
  onJoinRoom: () => void;
}

export default function JoinRoomButton({ roomId, username, onJoinRoom }: JoinRoomButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleJoinRoom = async () => {
    if (!roomId.trim()) {
      alert('Please enter a room ID');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SIGNALING_SERVER}/api/join-room`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomId, username }),
      });

      const data = await response.json();
      if (data.success) {
        onJoinRoom();
      } else {
        alert('Room not found or invalid');
      }
    } catch (error) {
      console.error('Error joining room:', error);
      alert('Error joining room');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleJoinRoom}
      disabled={isLoading}
      className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
    >
      {isLoading ? 'Joining Room...' : 'Join Existing Room'}
    </button>
  );
}