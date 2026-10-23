import { create } from 'zustand';
import { usePlayerStore } from './usePlayerStore';

export type SleepTimerMode = 'duration' | 'end_of_track' | null;

interface SleepTimerState {
  isActive: boolean;
  mode: SleepTimerMode;
  remainingSeconds: number;
  totalDurationSeconds: number;
  isFadingOut: boolean;
  isModalOpen: boolean;

  // Acciones
  startTimer: (minutes: number) => void;
  startEndOfTrackTimer: () => void;
  addMinutes: (minutes: number) => void;
  cancelTimer: () => void;
  openModal: () => void;
  closeModal: () => void;
  toggleModal: () => void;
}

let timerInterval: ReturnType<typeof setInterval> | null = null;
let savedVolumeBeforeFade: number | null = null;

export const useSleepTimerStore = create<SleepTimerState>((set, get) => ({
  isActive: false,
  mode: null,
  remainingSeconds: 0,
  totalDurationSeconds: 0,
  isFadingOut: false,
  isModalOpen: false,

  startTimer: (minutes: number) => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    if (savedVolumeBeforeFade !== null) {
      usePlayerStore.getState().setVolume(savedVolumeBeforeFade);
      savedVolumeBeforeFade = null;
    }

    const totalSecs = Math.max(1, Math.round(minutes * 60));

    set({
      isActive: true,
      mode: 'duration',
      remainingSeconds: totalSecs,
      totalDurationSeconds: totalSecs,
      isFadingOut: false,
      isModalOpen: false
    });

    timerInterval = setInterval(() => {
      const state = get();
      if (!state.isActive || state.mode !== 'duration') {
        if (timerInterval) clearInterval(timerInterval);
        return;
      }

      const nextRemaining = state.remainingSeconds - 1;

      // Micro fade-out en los últimos 3 segundos para desconexión suave
      if (nextRemaining <= 3 && nextRemaining > 0) {
        const playerState = usePlayerStore.getState();
        if (savedVolumeBeforeFade === null) {
          savedVolumeBeforeFade = playerState.volume;
        }
        const fadeFactor = Math.max(0, nextRemaining / 3);
        playerState.setVolume(savedVolumeBeforeFade * fadeFactor);
        set({ remainingSeconds: nextRemaining, isFadingOut: true });
        return;
      }

      // Finalización del temporizador
      if (nextRemaining <= 0) {
        if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
        }

        const playerState = usePlayerStore.getState();
        playerState.pause();

        // Restaurar el volumen original del usuario para futuras reproducciones
        if (savedVolumeBeforeFade !== null) {
          playerState.setVolume(savedVolumeBeforeFade);
          savedVolumeBeforeFade = null;
        }

        set({
          isActive: false,
          mode: null,
          remainingSeconds: 0,
          totalDurationSeconds: 0,
          isFadingOut: false
        });
        return;
      }

      set({ remainingSeconds: nextRemaining });
    }, 1000);
  },

  startEndOfTrackTimer: () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    if (savedVolumeBeforeFade !== null) {
      usePlayerStore.getState().setVolume(savedVolumeBeforeFade);
      savedVolumeBeforeFade = null;
    }

    const { duration, currentTime } = usePlayerStore.getState();
    const initialRemaining = Math.max(1, Math.round(duration - currentTime));

    set({
      isActive: true,
      mode: 'end_of_track',
      remainingSeconds: initialRemaining,
      totalDurationSeconds: initialRemaining,
      isFadingOut: false,
      isModalOpen: false
    });

    timerInterval = setInterval(() => {
      const state = get();
      if (!state.isActive || state.mode !== 'end_of_track') {
        if (timerInterval) clearInterval(timerInterval);
        return;
      }

      const playerState = usePlayerStore.getState();
      const trackRemaining = Math.max(0, Math.round(playerState.duration - playerState.currentTime));

      // Fade-out en los últimos 3 segundos de la pista
      if (trackRemaining <= 3 && trackRemaining > 0) {
        if (savedVolumeBeforeFade === null) {
          savedVolumeBeforeFade = playerState.volume;
        }
        const fadeFactor = Math.max(0, trackRemaining / 3);
        playerState.setVolume(savedVolumeBeforeFade * fadeFactor);
        set({ remainingSeconds: trackRemaining, isFadingOut: true });
        return;
      }

      // Al acabar la pista o llegar a 0
      if (trackRemaining <= 0 || !playerState.isPlaying) {
        if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
        }

        playerState.pause();

        if (savedVolumeBeforeFade !== null) {
          playerState.setVolume(savedVolumeBeforeFade);
          savedVolumeBeforeFade = null;
        }

        set({
          isActive: false,
          mode: null,
          remainingSeconds: 0,
          totalDurationSeconds: 0,
          isFadingOut: false
        });
        return;
      }

      set({ remainingSeconds: trackRemaining });
    }, 1000);
  },

  addMinutes: (minutes: number) => {
    const state = get();
    if (!state.isActive) {
      get().startTimer(minutes);
      return;
    }

    const additionalSeconds = minutes * 60;
    set({
      remainingSeconds: state.remainingSeconds + additionalSeconds,
      totalDurationSeconds: state.totalDurationSeconds + additionalSeconds,
      isFadingOut: false
    });

    if (savedVolumeBeforeFade !== null) {
      usePlayerStore.getState().setVolume(savedVolumeBeforeFade);
      savedVolumeBeforeFade = null;
    }
  },

  cancelTimer: () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    if (savedVolumeBeforeFade !== null) {
      usePlayerStore.getState().setVolume(savedVolumeBeforeFade);
      savedVolumeBeforeFade = null;
    }

    set({
      isActive: false,
      mode: null,
      remainingSeconds: 0,
      totalDurationSeconds: 0,
      isFadingOut: false
    });
  },

  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
  toggleModal: () => set({ isModalOpen: !get().isModalOpen })
}));
