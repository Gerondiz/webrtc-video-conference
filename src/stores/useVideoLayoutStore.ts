// src/stores/useVideoLayoutStore.ts
import { create } from 'zustand';

type VideoLayout = 'grid' | 'spotlight' | 'test-grid';

interface VideoLayoutStore {
  layout: VideoLayout;
  maxTilesPerRow: number;
  isSpeakerHighlightEnabled: boolean;

  setLayout: (layout: VideoLayout) => void;
  setMaxTilesPerRow: (value: number) => void;
  setIsSpeakerHighlightEnabled: (enabled: boolean) => void;
}

export const useVideoLayoutStore = create<VideoLayoutStore>((set) => ({
  layout: 'grid',
  maxTilesPerRow: 4,
  isSpeakerHighlightEnabled: true,

  setLayout: (layout) => set({ layout }),
  setMaxTilesPerRow: (maxTilesPerRow) => set({ maxTilesPerRow }),
  setIsSpeakerHighlightEnabled: (isSpeakerHighlightEnabled) =>
    set({ isSpeakerHighlightEnabled }),
}));