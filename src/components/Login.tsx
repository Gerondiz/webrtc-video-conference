// src/components/Login.tsx
"use client";
import React, { useState } from "react";
import InputField from "@/components/ui/InputField";
import Button from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { generateUsername } from "@/lib/utils";
import { createRoom, joinRoom } from "@/lib/api";
import { useToastHandler } from '@/hooks/useToastHandler';
import ServerStatus from './ServerStatus';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState<string>(generateUsername());
  const [roomId, setRoomId] = useState<string>("");
  const [isCreatingRoom, setIsCreatingRoom] = useState<boolean>(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState<boolean>(false);
  const router = useRouter();
  const { showError, showSuccess } = useToastHandler();

  const handleCreateRoom = async (): Promise<void> => {
    setIsCreatingRoom(true);
    try {
      const data = await createRoom(username);
      if (data.success) {
        showSuccess('Room created successfully!');
        router.push(`/room/${data.roomId}?username=${username}`);
        onLogin();
      }
    } catch (error: unknown) {
      console.error("Error creating room:", error);
      // Ошибки уже обрабатываются в интерцепторе
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleJoinRoom = async (): Promise<void> => {
    if (!roomId.trim()) {
      showError("Please enter a room ID");
      return;
    }
    setIsJoiningRoom(true);
    try {
      const data = await joinRoom(roomId, username);
      if (data.success) {
        showSuccess('Joined room successfully!');
        router.push(`/room/${roomId}?username=${username}`);
        onLogin();
      }
    } catch (error: unknown) {
      console.error("Error joining room:", error);
      // Ошибки уже обрабатываются в интерцепторе
    } finally {
      setIsJoiningRoom(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center p-4 relative">
      <div className="absolute top-4 left-4">
        <ServerStatus />
      </div>
      
      {/* <div className="absolute bottom-4 right-4">
        <Button
          href="/check-turn"
          className="p-2 rounded-full bg-[rgb(var(--primary-button-light))] hover:bg-[rgb(var(--primary-button-light)/0.9)] dark:bg-[rgb(var(--primary-button-dark))] dark:hover:bg-[rgb(var(--primary-button-dark)/0.9)] focus:outline-none focus:ring-2 focus:ring-offset-2"
          title="Check TURN server"
          aria-label="Check TURN server"
        >
          Check TURN
        </Button>
      </div> */}
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-8">
          WebRTC Video Conference
        </h1>

        <InputField
          id="username"
          name="username"
          label="Your Name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your name"
          autoComplete="name"
        />
        
        <Button
          onClick={handleCreateRoom}
          disabled={isCreatingRoom}
          className="w-full bg-[rgb(var(--primary-button-light))] text-white py-3 px-4 rounded-lg hover:bg-[rgb(var(--primary-button-light)/0.9)] dark:bg-[rgb(var(--primary-button-dark))] dark:hover:bg-[rgb(var(--primary-button-dark)/0.9)] focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-colors"
          aria-disabled={isCreatingRoom}
        >
          {isCreatingRoom ? "Creating Room..." : "Create New Room"}
        </Button>
        
        <div className="relative flex items-center my-6">
          <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
          <span className="flex-shrink mx-4 text-gray-600 dark:text-gray-400">or</span>
          <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
        </div>
        
        <InputField
          id="roomId"
          name="roomId"
          label="Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value.toUpperCase())}
          placeholder="Enter room ID"
        />
        
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