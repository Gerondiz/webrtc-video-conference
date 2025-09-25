// src/components/RoomPage/AdaptiveVideoGrid.tsx
'use client';
import { useVideoLayoutStore } from '@/stores/useVideoLayoutStore';
import OldGridView from '@/components/RoomPage/layouts/OldGridView';
import SpotlightView from '@/components/RoomPage/layouts/SpotlightView';
import TestGridView from '@/components/RoomPage/layouts/TestGridView'; // добавили
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

  const totalParticipants = useMemo(() => {
    const localCount = localStream ? 1 : 0;
    const remoteCount = remoteStreams.filter(remote =>
      remote.stream && remote.stream.getTracks().some(track => track.readyState === 'live')
    ).length;
    return localCount + remoteCount;
  }, [localStream, remoteStreams]);

  return (
    <div className="flex-1 relative overflow-hidden">
      {layout === 'grid' ? (
        <TestGridView remoteStreams={remoteStreams} />
      ) : layout === 'spotlight' ? (
        <SpotlightView remoteStreams={remoteStreams} />
      ) : layout === 'test-grid' ? ( // добавили
         <OldGridView remoteStreams={remoteStreams} totalParticipants={totalParticipants} />
      ) : (
        <TestGridView remoteStreams={remoteStreams} />
        
      )}
    </div>
  );
}