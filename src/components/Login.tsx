// src/components/Login.tsx
"use client";

import React, { useState } from "react";
import InputField from "@/components/ui/InputField";
import Button from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { generateUsername } from "@/lib/utils";
import { createRoom, joinRoom } from "@/lib/api";

interface LoginProps {
  onLogin: () => void; // Callback для обработки успешного входа
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState(generateUsername());
  const [roomId, setRoomId] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const router = useRouter();

  // Функция для создания новой комнаты
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

  // Функция для присоединения к существующей комнате
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 relative">
      {/* Кнопка Check TURN в верхнем правом углу */}
      <div className="absolute top-4 right-4">
        <Button
          href="/check-turn"
          className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          title="Check TURN server"
          aria-label="Check TURN server"
        >
          Check TURN
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          WebRTC Video Conference
        </h1>

        {/* Username Input */}
        <InputField
          id="username" // Уникальный ID
          name="username" // Имя для формы
          label="Your Name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your name"
          autoComplete="name" // Включаем автозаполнение
        />

        {/* Create Room Button */}
        <Button
          onClick={handleCreateRoom}
          disabled={isCreatingRoom}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
          aria-disabled={isCreatingRoom} // Улучшение доступности
        >
          {isCreatingRoom ? "Creating Room..." : "Create New Room"}
        </Button>

        {/* Separator */}
        <div className="relative flex items-center my-6">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="flex-shrink mx-4 text-gray-600">or</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        {/* Room ID Input */}
        <InputField
          id="roomId" // Добавляем уникальный ID
          name="roomId" // Добавляем имя
          label="Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value.toUpperCase())}
          placeholder="Enter room ID"
        />

        {/* Join Room Button */}
        <Button
          onClick={handleJoinRoom}
          disabled={isJoiningRoom}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
          aria-disabled={isJoiningRoom} // Улучшение доступности
        >
          {isJoiningRoom ? "Joining Room..." : "Join Existing Room"}
        </Button>

        <p className="text-center text-gray-500 text-sm mt-6">
          Start or join a video conference room to connect with others
        </p>
      </div>
    </div>
  );
}
