import { create } from 'zustand';
import { discordRpcService } from '../services/discord/DiscordRpcService';
import { Track } from '../types';

interface DiscordState {
  isEnabled: boolean;
  isConnected: boolean;

  // Acciones
  toggleEnabled: () => Promise<void>;
  checkStatus: () => Promise<void>;
  updateActivity: (
    track: Track | null,
    isPlaying: boolean,
    currentTime: number,
    duration: number
  ) => void;
  clearActivity: () => Promise<void>;
}

export const useDiscordStore = create<DiscordState>((set, get) => ({
  isEnabled: discordRpcService.getIsEnabled(),
  isConnected: false,

  toggleEnabled: async () => {
    const next = !get().isEnabled;
    await discordRpcService.setEnabled(next);
    set({ isEnabled: next });
    get().checkStatus();
  },

  checkStatus: async () => {
    const status = await discordRpcService.getStatus();
    set({
      isConnected: status.isConnected,
      isEnabled: status.isEnabled
    });
  },

  updateActivity: (
    track: Track | null,
    isPlaying: boolean,
    currentTime: number,
    duration: number
  ) => {
    if (get().isEnabled) {
      discordRpcService.updateActivity(track, isPlaying, currentTime, duration);
    }
  },

  clearActivity: async () => {
    await discordRpcService.clearActivity();
  }
}));
