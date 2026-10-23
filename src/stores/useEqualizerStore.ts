import { create } from 'zustand';
import {
  defaultEqualizerService,
  EqualizerBand,
  EqualizerPreset,
  SPOTIFY_EQ_PRESETS
} from '../services/audio/EqualizerService';

interface EqualizerState {
  isEnabled: boolean;
  activePresetId: string;
  bands: EqualizerBand[];
  presets: EqualizerPreset[];
  isModalOpen: boolean;

  // Acciones
  setBandGain: (bandIndex: number, gainDb: number) => void;
  applyPreset: (presetId: string) => void;
  toggleEnabled: () => void;
  resetToFlat: () => void;
  openModal: () => void;
  closeModal: () => void;
  toggleModal: () => void;
}

export const useEqualizerStore = create<EqualizerState>((set, get) => ({
  isEnabled: defaultEqualizerService.getIsEnabled(),
  activePresetId: defaultEqualizerService.getActivePresetId(),
  bands: defaultEqualizerService.getBands(),
  presets: SPOTIFY_EQ_PRESETS,
  isModalOpen: false,

  setBandGain: (bandIndex: number, gainDb: number) => {
    defaultEqualizerService.setBandGain(bandIndex, gainDb);
    set({
      bands: defaultEqualizerService.getBands(),
      activePresetId: defaultEqualizerService.getActivePresetId()
    });
  },

  applyPreset: (presetId: string) => {
    defaultEqualizerService.applyPreset(presetId);
    set({
      bands: defaultEqualizerService.getBands(),
      activePresetId: presetId
    });
  },

  toggleEnabled: () => {
    const nextState = !get().isEnabled;
    defaultEqualizerService.setEnabled(nextState);
    set({ isEnabled: nextState });
  },

  resetToFlat: () => {
    defaultEqualizerService.resetToFlat();
    set({
      bands: defaultEqualizerService.getBands(),
      activePresetId: 'flat'
    });
  },

  openModal: () => {
    // Asegurar que el AudioContext esté inicializado y activo
    defaultEqualizerService.ensureInitialized();
    defaultEqualizerService.resumeContext();
    set({ isModalOpen: true });
  },

  closeModal: () => {
    set({ isModalOpen: false });
  },

  toggleModal: () => {
    const next = !get().isModalOpen;
    if (next) {
      defaultEqualizerService.ensureInitialized();
      defaultEqualizerService.resumeContext();
    }
    set({ isModalOpen: next });
  }
}));
