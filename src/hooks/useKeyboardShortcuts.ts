import { useEffect } from 'react';
import { usePlayerStore } from '../stores/usePlayerStore';
import { useEqualizerStore } from '../stores/useEqualizerStore';

/**
 * Hook para atajos de teclado globales y locales de reproducción.
 * Soporta barra espaciadora, flechas, mute, shuffle, repeat y ecualizador (E).
 */
export function useKeyboardShortcuts() {
  const {
    currentTrack,
    currentTime,
    duration,
    volume,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    nextTrack,
    prevTrack,
    toggleShuffle,
    toggleRepeat,
    toggleLike
  } = usePlayerStore();

  const { toggleModal: toggleEqualizer } = useEqualizerStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar atajos si el usuario está escribiendo en un input o formulario
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;

        case 'ArrowRight':
          e.preventDefault();
          seek(Math.min(duration, currentTime + 5));
          break;

        case 'ArrowLeft':
          e.preventDefault();
          seek(Math.max(0, currentTime - 5));
          break;

        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.05));
          break;

        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.05));
          break;

        case 'KeyM':
          toggleMute();
          break;

        case 'KeyN':
          nextTrack();
          break;

        case 'KeyP':
          prevTrack();
          break;

        case 'KeyS':
          toggleShuffle();
          break;

        case 'KeyR':
          toggleRepeat();
          break;

        case 'KeyL':
          if (currentTrack) {
            toggleLike(currentTrack.id);
          }
          break;

        case 'KeyE':
          toggleEqualizer();
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    currentTrack,
    currentTime,
    duration,
    volume,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    nextTrack,
    prevTrack,
    toggleShuffle,
    toggleRepeat,
    toggleLike,
    toggleEqualizer
  ]);
}
