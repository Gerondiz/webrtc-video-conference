// src/components/Login.tsx
"use client";
import React, { useState, useEffect } from "react";
import InputField from "@/components/ui/InputField";
import Button from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { generateUsername } from "@/lib/utils";
import { createRoom, joinRoom } from "@/lib/api";
import { useMediaStream } from "@/contexts/MediaStreamContext";

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState(generateUsername());
  const [roomId, setRoomId] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const router = useRouter();
  
  const { 
    isInitializing, 
    error: mediaError,
    devicesStatus,
    stream: localStream,
    initMedia,
    hasAttemptedInitialization
  } = useMediaStream();

  // Инициализируем медиа только один раз при загрузке компонента
  useEffect(() => {
    if (!hasAttemptedInitialization && !isInitializing) {
      initMedia();
    }
  }, [hasAttemptedInitialization, isInitializing, initMedia]);

  const handleCreateRoom = async () => {
    setIsCreatingRoom(true);
    try {
      const data = await createRoom(username);
      if (data.success) {
        router.push(`/room/${data.roomId}?username=${username}`);
        onLogin();
      } else {
        alert("Failed to create room");
      }
    } catch (error) {
      console.error("Error creating room:", error);
      alert("Error creating room");
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomId.trim()) {
      alert("Please enter a room ID");
      return;
    }
    setIsJoiningRoom(true);
    try {
      const data = await joinRoom(roomId, username);
      if (data.success) {
        router.push(`/room/${roomId}?username=${username}`);
        onLogin();
      } else {
        alert("Room not found or invalid");
      }
    } catch (error) {
      console.error("Error joining room:", error);
      alert("Error joining room");
    } finally {
      setIsJoiningRoom(false);
    }
  };

  // Проверяем, есть ли медиаустройства
  const hasMediaDevices = devicesStatus.hasCamera || devicesStatus.hasMicrophone;

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Checking media devices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center p-4 relative">
      {/* Кнопка Check TURN */}
      <div className="absolute top-4 right-4">
        <Button
          href="/check-turn"
          className="p-2 rounded-full bg-[rgb(var(--primary-button-light))] hover:bg-[rgb(var(--primary-button-light)/0.9)] dark:bg-[rgb(var(--primary-button-dark))] dark:hover:bg-[rgb(var(--primary-button-dark)/0.9)] focus:outline-none focus:ring-2 focus:ring-offset-2"
          title="Check TURN server"
          aria-label="Check TURN server"
        >
          Check TURN
        </Button>
      </div>
      
      {/* Сообщения о состоянии медиа */}
      <div className="absolute top-4 left-4 max-w-md">
        {mediaError && (
          <div className="mb-2 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
            {mediaError}
            <button 
              onClick={initMedia}
              className="ml-2 px-2 py-1 bg-blue-500 text-white rounded text-sm"
            >
              Retry
            </button>
          </div>
        )}
        
        {!hasMediaDevices && !mediaError && (
          <div className="mb-2 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
            No media devices detected. You can still join for audio-only communication.
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-8">
          WebRTC Video Conference
        </h1>
        
        {/* Username Input */}
        <InputField
          id="username"
          name="username"
          label="Your Name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your name"
          autoComplete="name"
        />
        
        {/* Create Room Button */}
        <Button
          onClick={handleCreateRoom}
          disabled={isCreatingRoom}
          className="w-full bg-[rgb(var(--primary-button-light))] text-white py-3 px-4 rounded-lg hover:bg-[rgb(var(--primary-button-light)/0.9)] dark:bg-[rgb(var(--primary-button-dark))] dark:hover:bg-[rgb(var(--primary-button-dark)/0.9)] focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-colors"
          aria-disabled={isCreatingRoom}
        >
          {isCreatingRoom ? "Creating Room..." : "Create New Room"}
        </Button>
        
        {/* Separator */}
        <div className="relative flex items-center my-6">
          <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
          <span className="flex-shrink mx-4 text-gray-600 dark:text-gray-400">
            or
          </span>
          <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
        </div>
        
        {/* Room ID Input */}
        <InputField
          id="roomId"
          name="roomId"
          label="Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value.toUpperCase())}
          placeholder="Enter room ID"
        />
        
        {/* Join Room Button */}
        <Button
          onClick={handleJoinRoom}
          disabled={isJoiningRoom || !roomId.trim()}
          className="w-full bg-[rgb(var(--secondary-button-light))] text-white py-3 px-4 rounded-lg hover:bg-[rgb(var(--secondary-button-light)/0.9)] dark:bg-[rgb(var(--secondary-button-dark))] dark:hover:bg-[rgb(var(--secondary-button-dark)/0.9)] focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-colors"
          aria-disabled={isJoiningRoom || !roomId.trim()}
        >
          {isJoiningRoom ? "Joining Room..." : "Join Existing Room"}
        </Button>
        
        <p className="text-center text-gray-500 dark:text-gray-400 text-sm mt-6">
          Start or join a video conference room to connect with others
        </p>
      </div>
    </div>
  );
}