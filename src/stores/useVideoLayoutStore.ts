// src/stores/useVideoLayoutStore.ts
import { create } from 'zustand';

type VideoLayout = 'grid' | 'spotlight' | 'test-grid';

interface VideoLayoutStore {
  layout: VideoLayout;
  setLayout: (layout: VideoLayout) => void;
  maxTilesPerRow: number; // новое поле
  setMaxTilesPerRow: (value: number) => void;
}

export const useVideoLayoutStore = create<VideoLayoutStore>((set) => ({
  layout: 'grid',
  setLayout: (layout) => set({ layout }),
  maxTilesPerRow: 4, // по умолчанию
  setMaxTilesPerRow: (maxTilesPerRow) => set({ maxTilesPerRow }),
}));