// src/components/CreateRoomButton.tsx
'use client';

import { useState } from 'react';

interface CreateRoomButtonProps {
  username: string;
  onCreateRoom: (roomId: string) => void;
}

export default function CreateRoomButton({ username, onCreateRoom }: CreateRoomButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateRoom = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SIGNALING_SERVER}/api/create-room`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();
      if (data.success) {
        onCreateRoom(data.roomId);
      } else {
        alert('Failed to create room');
      }
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Error creating room');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleCreateRoom}
      disabled={isLoading}
      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
    >
      {isLoading ? 'Creating Room...' : 'Create New Room'}
    </button>
  );
}