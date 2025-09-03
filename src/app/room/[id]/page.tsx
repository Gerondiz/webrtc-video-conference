// app/room/[id]/page.tsx
'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMediaStream } from '@/contexts/MediaStreamContext';
import { useRoomConnection } from '@/hooks/useRoomConnection';
import RoomHeader from '@/components/RoomPage/RoomHeader';
import VideoGrid from '@/components/RoomPage/VideoGrid';
import ChatPanel from '@/components/RoomPage/ChatPanel';

export default function RoomPage() {
  const router = useRouter();
  const { stream: localStream } = useMediaStream();
  const {
    roomId,
    isConnected,
    isConnecting,
    sendChatMessage,
    leaveRoom,
  } = useRoomConnection();

  console.log(roomId, "isConnected: ", isConnected, "isConnecting",isConnecting)
  
  const [remoteStreams] = useState([]);

  const toggleMic = useCallback(() => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
    }
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
    }
  }, [localStream]);

  const handleLeaveRoom = useCallback(() => {
    leaveRoom();
    router.push('/');
  }, [leaveRoom, router]);

  const openSettings = useCallback(() => {
    console.log('Open settings');
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      <RoomHeader
        roomId={roomId}
        isConnected={isConnected}
        isConnecting={isConnecting}
        onToggleMic={toggleMic}
        onToggleVideo={toggleVideo}
        onLeaveRoom={handleLeaveRoom}
        onSettings={openSettings}
        userCount={1}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Убираем передачу localStream, так как VideoGrid использует контекст */}
        <VideoGrid remoteStreams={remoteStreams} />
        <ChatPanel 
          roomId={roomId} 
          sendMessage={sendChatMessage}
        />
      </div>
    </div>
  );
}