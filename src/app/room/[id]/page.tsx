// app/room/[id]/page.tsx
'use client';
import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMediaStream } from '@/contexts/MediaStreamContext';
import RoomHeader from '@/components/RoomPage/RoomHeader';
import VideoGrid from '@/components/RoomPage/VideoGrid';
import ChatPanel from '@/components/RoomPage/ChatPanel';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  
  const { stream: localStream, stopMediaStream } = useMediaStream();
  const [remoteStreams, setRemoteStreams] = useState([]);

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

  const leaveRoom = useCallback(() => {
    // Останавливаем медиапоток
    stopMediaStream();
    
    // Возвращаемся на главную
    router.push('/');
  }, [stopMediaStream, router]);

  const openSettings = useCallback(() => {
    // Логика открытия настроек
    console.log('Open settings');
  }, []);

  // Функция для отправки сообщений через WebSocket
  const sendChatMessage = useCallback((message: any) => {
    // Здесь будет логика отправки сообщения через WebSocket
    console.log('Sending message:', message);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      <RoomHeader
        roomId={roomId}
        onToggleMic={toggleMic}
        onToggleVideo={toggleVideo}
        onLeaveRoom={leaveRoom}
        onSettings={openSettings}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <VideoGrid remoteStreams={remoteStreams} />
        <ChatPanel 
          roomId={roomId} 
          sendMessage={sendChatMessage}
        />
      </div>
    </div>
  );
}