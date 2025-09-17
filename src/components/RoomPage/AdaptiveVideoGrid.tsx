// src/components/RoomPage/AdaptiveVideoGrid.tsx
'use client';
import { useVideoLayoutStore } from '@/stores/useVideoLayoutStore';
import GridView from '@/components/RoomPage/layouts/GridView';
import SpotlightView from '@/components/RoomPage/layouts/SpotlightView';
import { useMediaStream } from '@/contexts/MediaStreamContext';
import { useMemo } from 'react';

interface VideoStream {
  userId: string;
  username: string;
  stream: MediaStream;
}

interface AdaptiveVideoGridProps {
  remoteStreams: VideoStream[];
}

export default function AdaptiveVideoGrid({ remoteStreams }: AdaptiveVideoGridProps) {
  const layout = useVideoLayoutStore(state => state.layout);
  const { stream: localStream } = useMediaStream();

  // Вычисляем общее количество участников
  const totalParticipants = useMemo(() => {
    const localCount = localStream ? 1 : 0;
    const remoteCount = remoteStreams.filter(remote => 
      remote.stream && remote.stream.getTracks().some(track => track.readyState === 'live')
    ).length;
    return localCount + remoteCount;
  }, [localStream, remoteStreams]);

  return (
    // Этот контейнер обеспечивает максимальную высоту и скрывает переполнение
    // Центрирование теперь происходит внутри GridView
    <div className="flex-1 overflow-hidden">
      {layout === 'grid' ? (
        <GridView remoteStreams={remoteStreams} totalParticipants={totalParticipants} />
      ) : (
        <SpotlightView remoteStreams={remoteStreams} />
      )}
    </div>
  );
}