import { create } from 'zustand';
import { Track } from '../types';

interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  track: Track | null;
  openTrackMenu: (x: number, y: number, track: Track) => void;
  closeMenu: () => void;
}

export const useContextMenuStore = create<ContextMenuState>((set) => ({
  isOpen: false,
  x: 0,
  y: 0,
  track: null,
  openTrackMenu: (x: number, y: number, track: Track) => set({ isOpen: true, x, y, track }),
  closeMenu: () => set({ isOpen: false, track: null })
}));
