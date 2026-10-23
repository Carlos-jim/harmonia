import { create } from 'zustand';
import { THEME_PRESETS } from '../data/themePresets';
import { ThemePreset, BackgroundType } from '../types/theme';

interface ThemeState {
  currentPresetId: string;
  customUrl: string;
  customType: BackgroundType;
  blur: number;
  opacity: number;
  accentColor: string;
  isThemeGalleryOpen: boolean;

  // Actions
  setPreset: (presetId: string) => void;
  setBlur: (blur: number) => void;
  setOpacity: (opacity: number) => void;
  setMood: (mood: 'subtle' | 'balanced' | 'immersive') => void;
  setCustomBackground: (url: string, type: BackgroundType) => void;
  setAccentColor: (color: string) => void;
  openThemeGallery: () => void;
  closeThemeGallery: () => void;
  getActivePreset: () => ThemePreset;
}

const STORAGE_KEY = 'harmonia_theme_config_v1';

const loadSavedConfig = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error loading theme config from localStorage:', e);
  }
  return {
    currentPresetId: 'reactive-album',
    customUrl: '',
    customType: 'image-static' as BackgroundType,
    blur: 0,
    opacity: 0.8,
    accentColor: '#1db954'
  };
};

const saved = loadSavedConfig();
if (typeof document !== 'undefined' && saved.accentColor) {
  document.documentElement.style.setProperty('--accent', saved.accentColor);
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  currentPresetId: saved.currentPresetId || 'reactive-album',
  customUrl: saved.customUrl || '',
  customType: saved.customType || 'image-static',
  blur: saved.blur ?? 0,
  opacity: saved.opacity ?? 0.8,
  accentColor: saved.accentColor || '#1db954',
  isThemeGalleryOpen: false,

  setPreset: (presetId: string) => {
    const preset = THEME_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    const newBlur = preset.defaultBlur;
    const newOpacity = preset.defaultOpacity;
    const newAccent = preset.accentColor;

    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--accent', newAccent);
    }

    set({
      currentPresetId: presetId,
      blur: newBlur,
      opacity: newOpacity,
      accentColor: newAccent
    });

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          currentPresetId: presetId,
          customUrl: get().customUrl,
          customType: get().customType,
          blur: newBlur,
          opacity: newOpacity,
          accentColor: newAccent
        })
      );
    } catch (e) {
      console.warn('Failed saving theme config:', e);
    }
  },

  setMood: (mood: 'subtle' | 'balanced' | 'immersive') => {
    const moods = {
      subtle: { blur: 10, opacity: 0.4 },
      balanced: { blur: 3, opacity: 0.7 },
      immersive: { blur: 0, opacity: 0.95 }
    };
    const { blur, opacity } = moods[mood];
    set({ blur, opacity });
    try {
      const state = get();
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          currentPresetId: state.currentPresetId,
          customUrl: state.customUrl,
          customType: state.customType,
          blur,
          opacity,
          accentColor: state.accentColor
        })
      );
    } catch (e) {
      console.warn('Failed saving mood settings:', e);
    }
  },

  setBlur: (blur: number) => {
    set({ blur });
    try {
      const state = get();
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          currentPresetId: state.currentPresetId,
          customUrl: state.customUrl,
          customType: state.customType,
          blur,
          opacity: state.opacity,
          accentColor: state.accentColor
        })
      );
    } catch (e) {
      console.warn('Failed saving blur setting:', e);
    }
  },

  setOpacity: (opacity: number) => {
    set({ opacity });
    try {
      const state = get();
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          currentPresetId: state.currentPresetId,
          customUrl: state.customUrl,
          customType: state.customType,
          blur: state.blur,
          opacity,
          accentColor: state.accentColor
        })
      );
    } catch (e) {
      console.warn('Failed saving opacity setting:', e);
    }
  },

  setCustomBackground: (url: string, type: BackgroundType) => {
    set({
      customUrl: url,
      customType: type,
      currentPresetId: 'custom'
    });
    try {
      const state = get();
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          currentPresetId: 'custom',
          customUrl: url,
          customType: type,
          blur: state.blur,
          opacity: state.opacity,
          accentColor: state.accentColor
        })
      );
    } catch (e) {
      console.warn('Failed saving custom background:', e);
    }
  },

  setAccentColor: (accentColor: string) => {
    set({ accentColor });
  },

  openThemeGallery: () => set({ isThemeGalleryOpen: true }),
  closeThemeGallery: () => set({ isThemeGalleryOpen: false }),

  getActivePreset: () => {
    const { currentPresetId } = get();
    return THEME_PRESETS.find((p) => p.id === currentPresetId) || THEME_PRESETS[0];
  }
}));
