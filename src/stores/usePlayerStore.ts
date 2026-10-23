import { create } from 'zustand';
import { Track } from '../types';
import { SAMPLE_TRACKS } from '../data/mockData';
import { IAudioEngine } from '../contracts/audio';
import { defaultUnifiedAudioEngine } from '../services/audio/UnifiedAudioEngine';
import { providerManager } from '../services/providers/ProviderManager';
import { signalEngine } from '../services/recommendation/SignalEngine';
import { recommendationEngine } from '../services/recommendation/RecommendationEngine';

/**
 * Single Responsibility (SRP) & Dependency Inversion (DIP):
 * usePlayerStore solo gestiona el estado de reproducción y la cola.
 * Delega el audio físico a la abstracción IAudioEngine inyectada.
 */
interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: 'off' | 'all' | 'one';
  queue: Track[];
  queueIndex: number;
  likedTrackIds: Set<string>;
  isAutoplay: boolean;
  isFetchingRecommendations: boolean;
  crossfadeDuration: number;
  isCrossfadeEnabled: boolean;

  // Actions
  playTrack: (track: Track, newQueue?: Track[]) => void;
  togglePlay: () => void;
  pause: () => void;
  resume: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleLike: (trackId: string) => void;
  toggleAutoplay: () => void;
  playSeedTrack: (seedTrack: Track) => Promise<void>;
  startRadio: (seedTrack: Track) => Promise<void>;
  setCrossfadeDuration: (seconds: number) => void;
  toggleCrossfade: () => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  playQueueIndex: (index: number) => void;
}

// Factoría de store que permite inyectar cualquier motor de audio (HTML5, YouTube, Rodio nativo en Rust, etc.)
export const createPlayerStore = (engine: IAudioEngine = defaultUnifiedAudioEngine) => {
  return create<PlayerState>((set, get) => {
    // Inicializar duración de crossfade en el motor
    const savedCrossfade = typeof localStorage !== 'undefined' ? localStorage.getItem('harmonia_crossfade_duration') : null;
    const initialCrossfade = savedCrossfade !== null ? Number(savedCrossfade) : 4;
    engine.setCrossfadeDuration?.(initialCrossfade);

    // Configurar listeners de la abstracción IAudioEngine
    engine.setListeners({
      onTimeUpdate: (time) => {
        set({ currentTime: time });
        const { currentTrack } = get();
        if (currentTrack && time >= 30) {
          signalEngine.onThirtySecondsMilestone(currentTrack);
        }
      },
      onLoadedMetadata: (dur) => set({ duration: dur }),
      onEnded: () => {
        const { repeatMode, nextTrack, currentTrack, duration } = get();
        if (currentTrack) {
          signalEngine.onTrackEndOrChange(currentTrack, null, duration, duration, true);
        }
        if (repeatMode === 'one' && currentTrack) {
          engine.seek(0);
          engine.play();
        } else {
          nextTrack();
        }
      },
      onError: (err) => console.warn('PlayerEngine error:', err),
      onCrossfadeTrigger: async () => {
        const { queue, queueIndex, isShuffle, isAutoplay, isCrossfadeEnabled, crossfadeDuration, currentTrack } = get();
        if (!isCrossfadeEnabled || crossfadeDuration <= 0) return;

        let nextIndex = queueIndex + 1;
        let nextTrack: Track | undefined;

        if (isShuffle) {
          nextIndex = Math.floor(Math.random() * queue.length);
          nextTrack = queue[nextIndex];
        } else if (nextIndex < queue.length) {
          nextTrack = queue[nextIndex];
        } else if (isAutoplay && currentTrack) {
          try {
            const recs = await recommendationEngine.getRecommendedTracks(currentTrack, queue, 5);
            if (recs.length > 0) {
              const newQueue = [...queue, ...recs];
              nextTrack = recs[0];
              set({ queue: newQueue });
            }
          } catch (err) {
            console.warn('Error fetching autoplay for crossfade:', err);
          }
        }

        if (nextTrack && engine.startCrossfade) {
          await engine.startCrossfade(nextTrack.audioUrl);
        }
      },
      onCrossfadeCompleted: () => {
        const { queue, queueIndex, currentTrack, duration } = get();
        const nextIndex = queueIndex + 1;
        if (nextIndex < queue.length) {
          const nextTrack = queue[nextIndex];
          if (currentTrack) {
            signalEngine.onTrackEndOrChange(currentTrack, nextTrack, duration, duration, true);
          }
          signalEngine.onTrackStart(nextTrack);
          set({
            currentTrack: nextTrack,
            queueIndex: nextIndex,
            currentTime: 0,
            duration: nextTrack.duration
          });
        }
      }
    });

    return {
      currentTrack: SAMPLE_TRACKS[0],
      isPlaying: false,
      currentTime: 0,
      duration: SAMPLE_TRACKS[0].duration,
      volume: 0.8,
      isMuted: false,
      isShuffle: false,
      repeatMode: 'off',
      queue: SAMPLE_TRACKS,
      queueIndex: 0,
      likedTrackIds: new Set(['track-1', 'track-3']),
      isAutoplay: true,
      isFetchingRecommendations: false,
      crossfadeDuration: initialCrossfade,
      isCrossfadeEnabled: initialCrossfade > 0,

      playTrack: (track: Track, newQueue?: Track[]) => {
        const { currentTrack, currentTime, duration } = get();
        if (currentTrack && currentTrack.id !== track.id) {
          signalEngine.onTrackEndOrChange(currentTrack, track, currentTime, duration, false);
        }

        const currentQueue = newQueue || get().queue;
        const index = currentQueue.findIndex((t) => t.id === track.id);

        engine.load(track.audioUrl);
        engine.setVolume(get().isMuted ? 0 : get().volume);
        engine.play();

        signalEngine.onTrackStart(track);

        set({
          currentTrack: track,
          isPlaying: true,
          queue: currentQueue,
          queueIndex: index !== -1 ? index : 0,
          currentTime: 0,
          duration: track.duration
        });
      },

      togglePlay: () => {
        const { isPlaying, currentTrack, playTrack } = get();

        if (!currentTrack) {
          if (SAMPLE_TRACKS.length > 0) {
            playTrack(SAMPLE_TRACKS[0]);
          }
          return;
        }

        if (isPlaying) {
          engine.pause();
          set({ isPlaying: false });
        } else {
          engine.play();
          set({ isPlaying: true });
        }
      },

      pause: () => {
        engine.pause();
        set({ isPlaying: false });
      },

      resume: () => {
        engine.play();
        set({ isPlaying: true });
      },

      nextTrack: async () => {
        const { queue, queueIndex, isShuffle, isAutoplay, isFetchingRecommendations, currentTrack, playTrack } = get();
        if (queue.length === 0) return;

        let nextIndex = queueIndex + 1;
        if (isShuffle) {
          nextIndex = Math.floor(Math.random() * queue.length);
          playTrack(queue[nextIndex]);
          return;
        }

        if (nextIndex < queue.length) {
          playTrack(queue[nextIndex]);

          // Spotify Infinite Queue Pre-fetching: Si quedan 2 o menos pistas y Autoplay está activo,
          // solicitar con anticipación las siguientes pistas para que nunca haya silencios ni parones.
          if (isAutoplay && queue.length - nextIndex <= 2 && currentTrack && !isFetchingRecommendations) {
            set({ isFetchingRecommendations: true });
            recommendationEngine.getRecommendedTracks(queue[nextIndex] || currentTrack, queue, 8)
              .then((newRecs) => {
                if (newRecs.length > 0) {
                  set((s) => ({ queue: [...s.queue, ...newRecs], isFetchingRecommendations: false }));
                } else {
                  set({ isFetchingRecommendations: false });
                }
              })
              .catch(() => set({ isFetchingRecommendations: false }));
          }
          return;
        }

        // Si llegamos al final de la cola y Autoplay está activado:
        if (isAutoplay && currentTrack && !isFetchingRecommendations) {
          set({ isFetchingRecommendations: true });
          try {
            const recommended = await recommendationEngine.getRecommendedTracks(currentTrack, queue, 10);
            if (recommended.length > 0) {
              const newQueue = [...queue, ...recommended];
              set({ queue: newQueue, isFetchingRecommendations: false });
              playTrack(recommended[0], newQueue);
              return;
            }
          } catch (e) {
            console.warn('Autoplay error:', e);
          } finally {
            set({ isFetchingRecommendations: false });
          }
        }

        // Si no hay autoplay o no hay recomendaciones, volver al inicio
        playTrack(queue[0]);
      },

      prevTrack: () => {
        const { queue, queueIndex, currentTime, playTrack } = get();
        if (currentTime > 3) {
          engine.seek(0);
          set({ currentTime: 0 });
          return;
        }

        if (queue.length === 0) return;
        const prevIndex = queueIndex - 1 < 0 ? queue.length - 1 : queueIndex - 1;
        playTrack(queue[prevIndex]);
      },

      seek: (time: number) => {
        engine.seek(time);
        set({ currentTime: time });
      },

      setVolume: (volume: number) => {
        engine.setVolume(volume);
        set({ volume, isMuted: volume === 0 });
      },

      toggleMute: () => {
        const { isMuted, volume } = get();
        const nextMuted = !isMuted;
        engine.setMuted(nextMuted);
        set({ isMuted: nextMuted, volume: nextMuted ? 0 : (volume || 0.8) });
      },

      toggleShuffle: () => {
        set((state) => ({ isShuffle: !state.isShuffle }));
      },

      toggleRepeat: () => {
        set((state) => {
          const modes: ('off' | 'all' | 'one')[] = ['off', 'all', 'one'];
          const nextMode = modes[(modes.indexOf(state.repeatMode) + 1) % modes.length];
          return { repeatMode: nextMode };
        });
      },

      toggleLike: (trackId: string) => {
        const track = get().queue.find((t) => t.id === trackId) || get().currentTrack;
        set((state) => {
          const newSet = new Set(state.likedTrackIds);
          const isLiked = newSet.has(trackId);
          if (isLiked) {
            newSet.delete(trackId);
          } else {
            newSet.add(trackId);
          }
          return { likedTrackIds: newSet };
        });

        const isLikedNow = get().likedTrackIds.has(trackId);
        if (track) {
          signalEngine.onToggleLike(track, isLikedNow);
        }

        // Sincronización asíncrona con el proveedor activo (Navidrome / Subsonic)
        const provider = providerManager.getProvider();
        if (isLikedNow) {
          provider.starTrack(trackId).catch((err) => console.warn('Error starring track:', err));
        } else {
          provider.unstarTrack(trackId).catch((err) => console.warn('Error unstarring track:', err));
        }
      },

      toggleAutoplay: () => {
        set((state) => ({ isAutoplay: !state.isAutoplay }));
      },

      playSeedTrack: async (seedTrack: Track) => {
        // 1. Iniciar reproducción instantánea con la pista semilla (latencia 0ms, audio inmediato)
        get().playTrack(seedTrack, [seedTrack]);

        // 2. Enriquecer la cola asíncronamente con BaRT Radio de Spotify (mismo cantante y pares de género)
        set({ isFetchingRecommendations: true });
        try {
          const radioTracks = await recommendationEngine.generateRadio(seedTrack);
          const state = get();
          // Asegurar que el usuario no haya cambiado a otra canción mientras se cargaba
          if (state.currentTrack?.id === seedTrack.id) {
            const nextRecs = radioTracks.filter((t) => t.id !== seedTrack.id);
            set({
              queue: [seedTrack, ...nextRecs],
              queueIndex: 0,
              isFetchingRecommendations: false
            });
          }
        } catch (err) {
          console.warn('Error generating seed radio queue:', err);
          set({ isFetchingRecommendations: false });
        }
      },

      startRadio: async (seedTrack: Track) => {
        return get().playSeedTrack(seedTrack);
      },

      setCrossfadeDuration: (seconds: number) => {
        const sec = Math.max(0, Math.min(12, seconds));
        engine.setCrossfadeDuration?.(sec);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('harmonia_crossfade_duration', String(sec));
        }
        set({ crossfadeDuration: sec, isCrossfadeEnabled: sec > 0 });
      },

      toggleCrossfade: () => {
        const { isCrossfadeEnabled, crossfadeDuration } = get();
        const nextEnabled = !isCrossfadeEnabled;
        const nextDuration = nextEnabled ? (crossfadeDuration || 4) : 0;
        engine.setCrossfadeDuration?.(nextDuration);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('harmonia_crossfade_duration', String(nextDuration));
        }
        set({ isCrossfadeEnabled: nextEnabled, crossfadeDuration: nextDuration });
      },

      addToQueue: (track: Track) => {
        set((state) => ({ queue: [...state.queue, track] }));
      },

      removeFromQueue: (index: number) => {
        set((state) => {
          const newQueue = state.queue.filter((_, i) => i !== index);
          let newIndex = state.queueIndex;
          if (index < state.queueIndex) {
            newIndex = Math.max(0, state.queueIndex - 1);
          } else if (index === state.queueIndex) {
            newIndex = Math.min(newIndex, newQueue.length - 1);
          }
          return {
            queue: newQueue,
            queueIndex: newIndex
          };
        });
      },

      clearQueue: () => {
        const { currentTrack } = get();
        set({
          queue: currentTrack ? [currentTrack] : [],
          queueIndex: 0
        });
      },

      playQueueIndex: (index: number) => {
        const { queue, playTrack } = get();
        if (index >= 0 && index < queue.length) {
          playTrack(queue[index]);
        }
      }
    };
  });
};

export const usePlayerStore = createPlayerStore(defaultUnifiedAudioEngine);
