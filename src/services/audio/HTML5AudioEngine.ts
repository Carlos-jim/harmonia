import { IAudioEngine, AudioEngineListeners } from '../../contracts/audio';
import { defaultEqualizerService } from './EqualizerService';

/**
 * Single Responsibility Principle (SRP):
 * Esta clase es responsable ÚNICAMENTE de la interacción con el elemento de audio HTML5.
 * Conecta su flujo de salida al ecualizador gráfico Web Audio API de 6 bandas.
 */
export class HTML5AudioEngine implements IAudioEngine {
  private audio: HTMLAudioElement;
  private listeners: AudioEngineListeners | null = null;

  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'metadata';
    this.audio.crossOrigin = 'anonymous';

    defaultEqualizerService.attachAudioElement(this.audio);

    this.audio.ontimeupdate = () => {
      this.listeners?.onTimeUpdate(this.audio.currentTime);
    };

    this.audio.onloadedmetadata = () => {
      this.listeners?.onLoadedMetadata(this.audio.duration);
    };

    this.audio.onended = () => {
      this.listeners?.onEnded();
    };

    this.audio.onerror = (e) => {
      if (this.audio.crossOrigin) {
        this.audio.removeAttribute('crossOrigin');
        if (this.audio.src) {
          const currentUrl = this.audio.src;
          this.audio.src = currentUrl;
          this.audio.load();
          this.audio.play().catch(() => {});
          return;
        }
      }
      this.listeners?.onError?.(e);
    };
  }

  setListeners(listeners: AudioEngineListeners): void {
    this.listeners = listeners;
  }

  load(url: string): void {
    this.audio.src = url;
    this.audio.currentTime = 0;
  }

  async play(): Promise<void> {
    try {
      await this.audio.play();
    } catch (err) {
      // Browsers restrict auto-play or interruptions
      console.warn('AudioEngine: Playback request interrupted or unhandled:', err);
    }
  }

  pause(): void {
    this.audio.pause();
  }

  seek(timeInSeconds: number): void {
    if (isFinite(timeInSeconds)) {
      this.audio.currentTime = timeInSeconds;
    }
  }

  setVolume(volume: number): void {
    this.audio.volume = Math.max(0, Math.min(1, volume));
  }

  setMuted(muted: boolean): void {
    this.audio.muted = muted;
  }

  getCurrentTime(): number {
    return this.audio.currentTime || 0;
  }

  getDuration(): number {
    return this.audio.duration || 0;
  }
}

// Singleton instance for dependency injection
export const defaultAudioEngine = new HTML5AudioEngine();
