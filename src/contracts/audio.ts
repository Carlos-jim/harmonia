/**
 * Interface Segregation Principle (ISP) & Dependency Inversion Principle (DIP):
 * Abstracción del motor de audio. El reproductor depende de esta interfaz,
 * permitiendo cambiar entre HTML5 Audio en WebView o Rodio/Symphonia en Rust.
 */

export interface AudioEngineListeners {
  onTimeUpdate: (currentTime: number) => void;
  onLoadedMetadata: (duration: number) => void;
  onEnded: () => void;
  onError?: (error: unknown) => void;
  onCrossfadeTrigger?: () => void;
  onCrossfadeCompleted?: () => void;
}

export interface IAudioEngine {
  load(url: string): void;
  play(): Promise<void>;
  pause(): void;
  seek(timeInSeconds: number): void;
  setVolume(volume: number): void; // 0.0 a 1.0
  setMuted(muted: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  setListeners(listeners: AudioEngineListeners): void;
  setCrossfadeDuration?(seconds: number): void;
  startCrossfade?(nextUrl: string): Promise<void>;
  cancelCrossfade?(): void;
}
