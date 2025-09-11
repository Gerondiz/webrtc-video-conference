// src/components/RoomPage/AdaptiveVideoGrid.tsx
'use client';
import { useVideoLayoutStore } from '@/stores/useVideoLayoutStore';
import GridView from '@/components/RoomPage/layouts/GridView';
import SpotlightView from '@/components/RoomPage/layouts/SpotlightView';

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

  return (
    <div className="flex-1 overflow-hidden">
      {layout === 'grid' ? (
        <GridView remoteStreams={remoteStreams} />
      ) : (
        <SpotlightView remoteStreams={remoteStreams} />
      )}
    </div>
  );
}