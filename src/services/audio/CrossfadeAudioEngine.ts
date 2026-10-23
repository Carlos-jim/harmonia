import { IAudioEngine, AudioEngineListeners } from '../../contracts/audio';
import { defaultEqualizerService } from './EqualizerService';

/**
 * CrossfadeAudioEngine (Motor de Audio con Fundido Cruzado DJ):
 * Arquitectura de doble canal (Canal A y Canal B) inspirada en el motor de reproducción
 * de Spotify Desktop. Permite transiciones continuas sin cortes (Gapless & Crossfade)
 * utilizando curvas de potencia constante (Equal-Power Curve) y ecualización Web Audio API.
 */
export class CrossfadeAudioEngine implements IAudioEngine {
  private playerA: HTMLAudioElement;
  private playerB: HTMLAudioElement;

  private activePlayer: HTMLAudioElement;
  private incomingPlayer: HTMLAudioElement;

  private listeners: AudioEngineListeners | null = null;

  private masterVolume: number = 0.8;
  private isMuted: boolean = false;

  private crossfadeDuration: number = 4; // segundos (0 a 12s)
  private isCrossfading: boolean = false;
  private crossfadeTimer: ReturnType<typeof setInterval> | null = null;
  private crossfadeTriggeredForCurrent: boolean = false;

  constructor() {
    this.playerA = new Audio();
    this.playerA.preload = 'metadata';
    this.playerA.crossOrigin = 'anonymous';

    this.playerB = new Audio();
    this.playerB.preload = 'metadata';
    this.playerB.crossOrigin = 'anonymous';

    this.activePlayer = this.playerA;
    this.incomingPlayer = this.playerB;

    this.attachPlayerEvents(this.playerA);
    this.attachPlayerEvents(this.playerB);

    // Conectar ambos canales al ecualizador gráfico Web Audio API
    defaultEqualizerService.attachAudioElement(this.playerA);
    defaultEqualizerService.attachAudioElement(this.playerB);
  }

  private attachPlayerEvents(player: HTMLAudioElement) {
    player.ontimeupdate = () => {
      // Solo el canal activo emite eventos de tiempo a la UI
      if (player === this.activePlayer) {
        const currentTime = player.currentTime;
        const duration = player.duration || 0;
        this.listeners?.onTimeUpdate(currentTime);

        // Comprobación de disparo de Crossfade
        if (
          !this.isCrossfading &&
          !this.crossfadeTriggeredForCurrent &&
          this.crossfadeDuration > 0 &&
          duration > 15 &&
          duration - currentTime <= this.crossfadeDuration &&
          duration - currentTime > 0.4
        ) {
          this.crossfadeTriggeredForCurrent = true;
          this.listeners?.onCrossfadeTrigger?.();
        }
      }
    };

    player.onloadedmetadata = () => {
      if (player === this.activePlayer) {
        this.listeners?.onLoadedMetadata(player.duration || 0);
      }
    };

    player.onended = () => {
      if (player === this.activePlayer && !this.isCrossfading) {
        this.listeners?.onEnded();
      }
    };

    player.onerror = (e) => {
      // Fallback si el servidor remoto bloquea CORS anónimo
      if (player.crossOrigin) {
        player.removeAttribute('crossOrigin');
        if (player.src) {
          const currentUrl = player.src;
          player.src = currentUrl;
          player.load();
          player.play().catch(() => {});
          return;
        }
      }
      if (player === this.activePlayer) {
        this.listeners?.onError?.(e);
      }
    };
  }

  public setListeners(listeners: AudioEngineListeners): void {
    this.listeners = listeners;
  }

  public setCrossfadeDuration(seconds: number): void {
    this.crossfadeDuration = Math.max(0, Math.min(12, seconds));
  }

  public getCrossfadeDuration(): number {
    return this.crossfadeDuration;
  }

  public load(url: string): void {
    this.cancelCrossfade();
    this.crossfadeTriggeredForCurrent = false;

    // Si ya hay algo sonando y no está pausado, realizamos un micro fade-out de 150ms
    if (!this.activePlayer.paused && this.activePlayer.currentTime > 0) {
      this.microFadeOutAndLoad(url);
    } else {
      this.activePlayer.src = url;
      this.activePlayer.currentTime = 0;
      this.applyVolumes();
    }
  }

  private microFadeOutAndLoad(url: string) {
    const fadeSteps = 5;
    const stepTime = 30; // 150ms total
    let step = 0;
    const initialVol = this.activePlayer.volume;

    const fadeInterval = setInterval(() => {
      step++;
      const factor = 1 - step / fadeSteps;
      this.activePlayer.volume = Math.max(0, initialVol * factor);

      if (step >= fadeSteps) {
        clearInterval(fadeInterval);
        this.activePlayer.pause();
        this.activePlayer.src = url;
        this.activePlayer.currentTime = 0;
        this.applyVolumes();
        this.activePlayer.play().catch((err) => console.warn('Play interrupted:', err));
      }
    }, stepTime);
  }

  public async play(): Promise<void> {
    try {
      this.applyVolumes();
      await this.activePlayer.play();
    } catch (err) {
      console.warn('CrossfadeAudioEngine: Error al reproducir:', err);
    }
  }

  public pause(): void {
    this.activePlayer.pause();
    if (this.isCrossfading) {
      this.incomingPlayer.pause();
    }
  }

  public seek(timeInSeconds: number): void {
    if (isFinite(timeInSeconds)) {
      if (this.isCrossfading) {
        this.cancelCrossfade();
      }
      this.activePlayer.currentTime = timeInSeconds;
    }
  }

  public setVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    this.applyVolumes();
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    this.activePlayer.muted = muted;
    this.incomingPlayer.muted = muted;
    this.applyVolumes();
  }

  private applyVolumes() {
    if (!this.isCrossfading) {
      this.activePlayer.volume = this.isMuted ? 0 : this.masterVolume;
      this.incomingPlayer.volume = 0;
    }
  }

  public getCurrentTime(): number {
    return this.activePlayer.currentTime || 0;
  }

  public getDuration(): number {
    return this.activePlayer.duration || 0;
  }

  /**
   * Inicia la transición continua (Crossfade) hacia la siguiente pista.
   * Utiliza la curva de ecualización de potencia constante:
   * FadeOut = cos(p * π/2), FadeIn = sin(p * π/2).
   */
  public async startCrossfade(nextUrl: string): Promise<void> {
    if (this.isCrossfading || this.crossfadeDuration <= 0) return;

    this.isCrossfading = true;
    this.incomingPlayer.src = nextUrl;
    this.incomingPlayer.currentTime = 0;
    this.incomingPlayer.volume = 0;

    try {
      await this.incomingPlayer.play();
    } catch (e) {
      console.warn('Error starting incoming crossfade track:', e);
      this.cancelCrossfade();
      return;
    }

    const durationMs = this.crossfadeDuration * 1000;
    const intervalMs = 35; // ~30 fps actualización suave
    const startTime = performance.now();

    this.crossfadeTimer = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(1, elapsed / durationMs);

      // Curva Equal-Power (estándar de la industria musical y de DJ)
      const fadeOutCurve = Math.cos(progress * 0.5 * Math.PI);
      const fadeInCurve = Math.sin(progress * 0.5 * Math.PI);

      if (!this.isMuted) {
        this.activePlayer.volume = Math.max(0, Math.min(1, this.masterVolume * fadeOutCurve));
        this.incomingPlayer.volume = Math.max(0, Math.min(1, this.masterVolume * fadeInCurve));
      }

      if (progress >= 1) {
        this.finishCrossfade();
      }
    }, intervalMs);
  }

  private finishCrossfade() {
    if (this.crossfadeTimer) {
      clearInterval(this.crossfadeTimer);
      this.crossfadeTimer = null;
    }

    // Detener y resetear el reproductor saliente
    this.activePlayer.pause();
    this.activePlayer.currentTime = 0;
    this.activePlayer.volume = 0;

    // Intercambiar roles de canal (Canal B pasa a ser activo)
    const previousActive = this.activePlayer;
    this.activePlayer = this.incomingPlayer;
    this.incomingPlayer = previousActive;

    this.isCrossfading = false;
    this.crossfadeTriggeredForCurrent = false;

    // Notificar al store que el crossfade ha finalizado para sincronizar track y UI
    this.listeners?.onCrossfadeCompleted?.();
  }

  public cancelCrossfade(): void {
    if (this.crossfadeTimer) {
      clearInterval(this.crossfadeTimer);
      this.crossfadeTimer = null;
    }

    if (this.isCrossfading) {
      this.incomingPlayer.pause();
      this.incomingPlayer.currentTime = 0;
      this.incomingPlayer.volume = 0;
      this.isCrossfading = false;
    }

    this.applyVolumes();
  }
}

export const defaultCrossfadeAudioEngine = new CrossfadeAudioEngine();
