// src/stores/useVideoLayoutStore.ts
import { create } from 'zustand';

type VideoLayout = 'grid' | 'spotlight';

interface VideoLayoutStore {
  layout: VideoLayout;
  setLayout: (layout: VideoLayout) => void;
}

export const useVideoLayoutStore = create<VideoLayoutStore>((set) => ({
  layout: 'grid', // По умолчанию grid
  setLayout: (layout) => set({ layout }),
}));