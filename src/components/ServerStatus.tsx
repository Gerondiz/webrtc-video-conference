// src/components/ServerStatus.tsx
"use client";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";

interface ServerStatus {
  status: string;
  timestamp: number;
  rooms: number;
  maxRooms: number;
  maxUsers: number;
  sessionTimeout: string;
}

export default function ServerStatus() {
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/api/health', {
          timeout: 5000
        });
        setStatus(response.data);
        setError(null);
      } catch (err) {
        setError('Server is unavailable. Please try again.');
        console.error('Server health check failed:', err);
      } finally {
        setLoading(false);
      }
    };

    checkServerStatus();
    // Убрали setInterval и return с clearInterval
  }, []);

  if (loading) {
    return (
      <div className="p-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-md text-xs">
        <p>Checking server...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-md text-xs">
        <p>{error}</p>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  return (
    <div className="p-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-md text-xs">
      <div className="font-medium">Server: {status.status}</div>
      <div>Rooms: {status.rooms}/{status.maxRooms}</div>
      <div>Users: {status.maxUsers} max</div>
    </div>
  );
}