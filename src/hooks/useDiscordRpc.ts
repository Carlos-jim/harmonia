import { useEffect } from 'react';
import { usePlayerStore } from '../stores/usePlayerStore';
import { useDiscordStore } from '../stores/useDiscordStore';

/**
 * Hook de sincronización automática en segundo plano con Discord Rich Presence.
 * Mantiene actualizado el estado de reproducción ("Escuchando Harmonia"),
 * carátula de álbum y timestamps en Discord.
 */
export function useDiscordRpc() {
  const { currentTrack, isPlaying, currentTime, duration } = usePlayerStore();
  const { isEnabled, updateActivity, checkStatus } = useDiscordStore();

  // Comprobar estado de conexión inicial
  useEffect(() => {
    checkStatus();
    const interval = setInterval(() => {
      checkStatus();
    }, 15000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  // Actualizar presencia al cambiar de canción, reproducir o pausar
  useEffect(() => {
    if (isEnabled && currentTrack) {
      updateActivity(currentTrack, isPlaying, currentTime, duration);
    }
  }, [currentTrack?.id, isPlaying, Math.floor(currentTime / 5), duration, isEnabled, updateActivity]);
}
