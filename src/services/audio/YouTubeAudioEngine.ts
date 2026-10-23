import { IAudioEngine, AudioEngineListeners } from '../../contracts/audio';

// Extend window for YouTube IFrame API
declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string | HTMLElement,
        options: {
          height: string | number;
          width: string | number;
          videoId?: string;
          playerVars?: Record<string, unknown>;
          events?: {
            onReady?: (event: { target: YTPlayerInstance }) => void;
            onStateChange?: (event: { data: number }) => void;
            onError?: (event: { data: number }) => void;
          };
        }
      ) => YTPlayerInstance;
      PlayerState: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayerInstance {
  loadVideoById(id: string | { videoId: string; startSeconds?: number }): void;
  cueVideoById(id: string | { videoId: string; startSeconds?: number }): void;
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead?: boolean): void;
  setVolume(volume: number): void; // 0 - 100
  mute(): void;
  unMute(): void;
  isMuted(): boolean;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
}

/**
 * Single Responsibility Principle (SRP) & Dependency Inversion Principle (DIP):
 * Motor de audio oficial para YouTube Music.
 * Controla la instancia invisible de YouTube Player, garantizando reproducción inmediata
 * con soporte para enablejsapi, autoplay y sincronización en tiempo real con la UI de Harmonia.
 */
export class YouTubeAudioEngine implements IAudioEngine {
  private player: YTPlayerInstance | null = null;
  private listeners: AudioEngineListeners | null = null;
  private isReady = false;
  private pendingVideoId: string | null = null;
  private pendingPlay = false;
  private timer: number | null = null;
  private currentVolume = 80;
  private isMutedState = false;

  constructor() {
    this.initPlayer();
  }

  private initPlayer() {
    if (typeof window === 'undefined') return;

    // Asegurarse de que el script oficial de YouTube IFrame API esté en el DOM
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      document.head.appendChild(tag);
    }

    let attempts = 0;
    const maxAttempts = 150;

    const tryInit = () => {
      attempts++;
      if (window.YT && window.YT.Player) {
        let container = document.getElementById('harmonia-yt-player-container');
        if (!container) {
          container = document.createElement('div');
          container.id = 'harmonia-yt-player-container';
          container.style.cssText = 'position:fixed;top:-1000px;left:-1000px;width:300px;height:200px;pointer-events:none;z-index:-9999;';
          document.body.appendChild(container);
        }

        try {
          this.player = new window.YT.Player('harmonia-yt-player-container', {
            height: '200',
            width: '300',
            playerVars: {
              enablejsapi: 1,
              autoplay: 1,
              controls: 0,
              disablekb: 1,
              fs: 0,
              rel: 0,
              modestbranding: 1,
              playsinline: 1,
              origin: window.location.origin
            },
            events: {
              onReady: (event) => {
                this.player = event.target;
                this.isReady = true;
                this.player.setVolume(this.currentVolume);
                if (this.isMutedState) {
                  this.player.mute();
                } else {
                  this.player.unMute();
                }

                if (this.pendingVideoId) {
                  const id = this.pendingVideoId;
                  this.pendingVideoId = null;
                  this.load(id);
                  if (this.pendingPlay) {
                    this.play();
                    this.pendingPlay = false;
                  }
                }
              },
              onStateChange: (event) => {
                // -1: UNSTARTED, 0: ENDED, 1: PLAYING, 2: PAUSED, 3: BUFFERING, 5: CUED
                if (event.data === 0) {
                  this.stopTicker();
                  this.listeners?.onEnded();
                } else if (event.data === 1) {
                  this.startTicker();
                  const dur = this.getDuration();
                  if (dur > 0) {
                    this.listeners?.onLoadedMetadata(dur);
                  }
                } else if (event.data === 2) {
                  this.stopTicker();
                }
              },
              onError: (err) => {
                console.warn('YouTubeAudioEngine playback error:', err);
                this.listeners?.onError?.(err);
              }
            }
          });
        } catch (e) {
          console.warn('Error constructing YT.Player:', e);
          if (attempts < maxAttempts) setTimeout(tryInit, 100);
        }
      } else {
        if (attempts < maxAttempts) {
          setTimeout(tryInit, 50);
        }
      }
    };

    // Registrar callback oficial y también iniciar polling para evitar race conditions
    const prevOnReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prevOnReady?.();
      tryInit();
    };

    tryInit();
  }

  private extractVideoId(url: string): string {
    if (!url) return '';
    const clean = url.trim();

    if (clean.startsWith('youtube://')) {
      return clean.replace('youtube://', '').split('?')[0].split('&')[0];
    }

    const vParam = clean.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (vParam) return vParam[1];

    const shortMatch = clean.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch) return shortMatch[1];

    const embedMatch = clean.match(/embed\/([a-zA-Z0-9_-]{11})/);
    if (embedMatch) return embedMatch[1];

    if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) {
      return clean;
    }

    return clean.replace(/^https?:\/\/.*[?&]v=/, '').replace(/^youtube:\/\//, '');
  }

  private startTicker() {
    this.stopTicker();
    this.timer = window.setInterval(() => {
      if (this.player && typeof this.player.getCurrentTime === 'function') {
        const current = this.player.getCurrentTime();
        const duration = this.player.getDuration();
        if (duration > 0) {
          this.listeners?.onLoadedMetadata(duration);
        }
        this.listeners?.onTimeUpdate(current);
      }
    }, 200);
  }

  private stopTicker() {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  setListeners(listeners: AudioEngineListeners): void {
    this.listeners = listeners;
  }

  load(url: string): void {
    const videoId = this.extractVideoId(url);
    if (!videoId) return;

    if (!this.isReady || !this.player) {
      this.pendingVideoId = videoId;
      this.pendingPlay = true;
      return;
    }

    try {
      this.player.loadVideoById(videoId);
      this.player.playVideo();
      this.startTicker();
    } catch (err) {
      console.warn('YouTube load error:', err);
    }
  }

  async play(): Promise<void> {
    if (!this.player || !this.isReady) {
      this.pendingPlay = true;
      return;
    }

    try {
      this.player.playVideo();
      this.startTicker();
    } catch (err) {
      console.warn('YouTube play error:', err);
    }
  }

  pause(): void {
    this.stopTicker();
    this.pendingPlay = false;
    if (!this.player || !this.isReady) return;

    try {
      this.player.pauseVideo();
    } catch (err) {
      console.warn('YouTube pause error:', err);
    }
  }

  seek(timeInSeconds: number): void {
    if (!this.player || !this.isReady) return;

    try {
      this.player.seekTo(timeInSeconds, true);
    } catch (err) {
      console.warn('YouTube seek error:', err);
    }
  }

  setVolume(volume: number): void {
    this.currentVolume = Math.round(Math.max(0, Math.min(1, volume)) * 100);
    if (this.player && this.isReady && typeof this.player.setVolume === 'function') {
      this.player.setVolume(this.currentVolume);
    }
  }

  setMuted(muted: boolean): void {
    this.isMutedState = muted;
    if (this.player && this.isReady) {
      if (muted) this.player.mute();
      else this.player.unMute();
    }
  }

  getCurrentTime(): number {
    if (!this.player || !this.isReady || typeof this.player.getCurrentTime !== 'function') return 0;
    return this.player.getCurrentTime() || 0;
  }

  getDuration(): number {
    if (!this.player || !this.isReady || typeof this.player.getDuration !== 'function') return 0;
    return this.player.getDuration() || 0;
  }
}
