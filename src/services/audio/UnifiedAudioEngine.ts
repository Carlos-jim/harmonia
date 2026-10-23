import { IAudioEngine, AudioEngineListeners } from '../../contracts/audio';
import { CrossfadeAudioEngine } from './CrossfadeAudioEngine';
import { YouTubeAudioEngine } from './YouTubeAudioEngine';

/**
 * Open/Closed Principle (OCP) & Composite Pattern:
 * UnifiedAudioEngine unifica la reproducción tanto de fuentes directas (Navidrome, Audius, MP3 locales)
 * como de grabaciones oficiales de YouTube Music.
 * Integra soporte de doble canal para Crossfade DJ continuo.
 */
export class UnifiedAudioEngine implements IAudioEngine {
  private crossfadeEngine: CrossfadeAudioEngine;
  private ytEngine: YouTubeAudioEngine;
  private activeMode: 'html5' | 'youtube' = 'html5';
  private listeners: AudioEngineListeners | null = null;

  constructor() {
    this.crossfadeEngine = new CrossfadeAudioEngine();
    this.ytEngine = new YouTubeAudioEngine();

    // Reenviar eventos del motor Crossfade/HTML5
    this.crossfadeEngine.setListeners({
      onTimeUpdate: (time) => {
        if (this.activeMode === 'html5') this.listeners?.onTimeUpdate(time);
      },
      onLoadedMetadata: (dur) => {
        if (this.activeMode === 'html5') this.listeners?.onLoadedMetadata(dur);
      },
      onEnded: () => {
        if (this.activeMode === 'html5') this.listeners?.onEnded();
      },
      onError: (err) => {
        if (this.activeMode === 'html5') this.listeners?.onError?.(err);
      },
      onCrossfadeTrigger: () => {
        if (this.activeMode === 'html5') this.listeners?.onCrossfadeTrigger?.();
      },
      onCrossfadeCompleted: () => {
        if (this.activeMode === 'html5') this.listeners?.onCrossfadeCompleted?.();
      }
    });

    // Reenviar eventos del motor YouTube
    this.ytEngine.setListeners({
      onTimeUpdate: (time) => {
        if (this.activeMode === 'youtube') this.listeners?.onTimeUpdate(time);
      },
      onLoadedMetadata: (dur) => {
        if (this.activeMode === 'youtube') this.listeners?.onLoadedMetadata(dur);
      },
      onEnded: () => {
        if (this.activeMode === 'youtube') this.listeners?.onEnded();
      },
      onError: (err) => {
        if (this.activeMode === 'youtube') this.listeners?.onError?.(err);
      }
    });
  }

  setListeners(listeners: AudioEngineListeners): void {
    this.listeners = listeners;
  }

  load(url: string): void {
    const isYt =
      url.startsWith('youtube://') ||
      url.includes('/api/youtube/stream') ||
      url.includes('youtube.com') ||
      url.includes('youtu.be');

    if (isYt) {
      this.activeMode = 'youtube';
      this.crossfadeEngine.pause();
      this.ytEngine.load(url);
    } else {
      this.activeMode = 'html5';
      this.ytEngine.pause();
      this.crossfadeEngine.load(url);
    }
  }

  async play(): Promise<void> {
    if (this.activeMode === 'youtube') {
      return this.ytEngine.play();
    } else {
      return this.crossfadeEngine.play();
    }
  }

  pause(): void {
    if (this.activeMode === 'youtube') {
      this.ytEngine.pause();
    } else {
      this.crossfadeEngine.pause();
    }
  }

  seek(timeInSeconds: number): void {
    if (this.activeMode === 'youtube') {
      this.ytEngine.seek(timeInSeconds);
    } else {
      this.crossfadeEngine.seek(timeInSeconds);
    }
  }

  setVolume(volume: number): void {
    this.crossfadeEngine.setVolume(volume);
    this.ytEngine.setVolume(volume);
  }

  setMuted(muted: boolean): void {
    this.crossfadeEngine.setMuted(muted);
    this.ytEngine.setMuted(muted);
  }

  getCurrentTime(): number {
    return this.activeMode === 'youtube'
      ? this.ytEngine.getCurrentTime()
      : this.crossfadeEngine.getCurrentTime();
  }

  getDuration(): number {
    return this.activeMode === 'youtube'
      ? this.ytEngine.getDuration()
      : this.crossfadeEngine.getDuration();
  }

  setCrossfadeDuration(seconds: number): void {
    this.crossfadeEngine.setCrossfadeDuration(seconds);
  }

  async startCrossfade(nextUrl: string): Promise<void> {
    if (this.activeMode === 'html5') {
      await this.crossfadeEngine.startCrossfade(nextUrl);
    } else {
      this.load(nextUrl);
      await this.play();
    }
  }

  cancelCrossfade(): void {
    this.crossfadeEngine.cancelCrossfade();
  }
}

export const defaultUnifiedAudioEngine = new UnifiedAudioEngine();
