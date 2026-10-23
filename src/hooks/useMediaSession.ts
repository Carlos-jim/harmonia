import { useEffect } from 'react';
import { usePlayerStore } from '../stores/usePlayerStore';

/**
 * Hook para sincronizar el reproductor con la MediaSession API del sistema.
 * En Windows (WebView2), esto activa automáticamente los Controles de Transporte
 * Multimedia del Sistema (SMTC), mostrando la notificación flotante nativa y
 * respondiendo a las teclas multimedia físicas del teclado y auriculares.
 */
export function useMediaSession() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    nextTrack,
    prevTrack,
    seek
  } = usePlayerStore();

  // Actualizar metadatos y carátula en el overlay nativo del sistema
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist,
      album: currentTrack.album,
      artwork: [
        {
          src: currentTrack.coverUrl,
          sizes: '512x512',
          type: 'image/jpeg'
        }
      ]
    });
  }, [currentTrack]);

  // Actualizar estado de reproducción (playing / paused)
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

  // Sincronizar posición y duración para la barra nativa del sistema
  useEffect(() => {
    if (!('mediaSession' in navigator) || !duration) return;

    try {
      if ('setPositionState' in navigator.mediaSession) {
        navigator.mediaSession.setPositionState({
          duration: Math.max(0, duration),
          playbackRate: 1,
          position: Math.max(0, Math.min(currentTime, duration))
        });
      }
    } catch (err) {
      // Ignorar micro-desincronizaciones en cambio de canción
    }
  }, [currentTime, duration]);

  // Registrar manejadores de acciones multimedia físicas (Play, Pausa, Siguiente, Anterior, Seek)
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const actionHandlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', () => togglePlay()],
      ['pause', () => togglePlay()],
      ['nexttrack', () => nextTrack()],
      ['previoustrack', () => prevTrack()],
      [
        'seekto',
        (details) => {
          if (details.seekTime !== undefined) {
            seek(details.seekTime);
          }
        }
      ]
    ];

    for (const [action, handler] of actionHandlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (err) {
        console.warn(`MediaSession action "${action}" not supported:`, err);
      }
    }

    return () => {
      for (const [action] of actionHandlers) {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {
          // cleanup
        }
      }
    };
  }, [togglePlay, nextTrack, prevTrack, seek]);
}
