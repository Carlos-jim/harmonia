/**
 * EqualizerService (Servicio de Ecualización Gráfica Multibanda Web Audio API):
 * 
 * Implementación de ingeniería inversa de arquitectura (REA) del ecualizador
 * oficial de Spotify Desktop de 6 bandas (-12 dB a +12 dB).
 * 
 * Gestiona un AudioContext con una cadena de 6 filtros BiquadFilterNode conectados en serie:
 * - 60 Hz: Lowshelf (Sub-graves)
 * - 150 Hz: Peaking (Graves)
 * - 400 Hz: Peaking (Medios bajos)
 * - 1.0 kHz: Peaking (Medios vocales)
 * - 2.4 kHz: Peaking (Medios altos / Claridad)
 * - 15.0 kHz: Highshelf (Agudos y brillo cristalino)
 * 
 * Permite conmutación en caliente de presets, bypass transparente libre de pops,
 * conexión multicanal para Crossfade DJ y persistencia en localStorage.
 */

export interface EqualizerBand {
  readonly frequency: number;
  readonly label: string;
  readonly category: 'graves' | 'medios' | 'agudos';
  readonly type: BiquadFilterType;
  gain: number;
}

export interface EqualizerPreset {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly gains: [number, number, number, number, number, number];
}

export const EQUALIZER_BANDS_CONFIG: Array<Omit<EqualizerBand, 'gain'>> = [
  { frequency: 60, label: '60 Hz', category: 'graves', type: 'lowshelf' },
  { frequency: 150, label: '150 Hz', category: 'graves', type: 'peaking' },
  { frequency: 400, label: '400 Hz', category: 'medios', type: 'peaking' },
  { frequency: 1000, label: '1 kHz', category: 'medios', type: 'peaking' },
  { frequency: 2400, label: '2.4 kHz', category: 'medios', type: 'peaking' },
  { frequency: 15000, label: '15 kHz', category: 'agudos', type: 'highshelf' }
];

export const SPOTIFY_EQ_PRESETS: EqualizerPreset[] = [
  {
    id: 'flat',
    name: 'Plano',
    description: 'Respuesta neutra y lineal fiel a la mezcla original de estudio.',
    gains: [0, 0, 0, 0, 0, 0]
  },
  {
    id: 'bass_boost',
    name: 'Refuerzo de graves',
    description: 'Acentúa frecuencias sub-graves y bajos para bombos contundentes.',
    gains: [6, 4.5, 2, 0, 0, 0]
  },
  {
    id: 'bass_reducer',
    name: 'Reducción de graves',
    description: 'Disminuye retumbos en auriculares pequeños o ambientes con eco.',
    gains: [-6, -4, -2, 0, 0, 0]
  },
  {
    id: 'electronic',
    name: 'Electrónica / Dance',
    description: 'Curva en V con subgraves potentes y agudos cortantes para EDM y Club.',
    gains: [5, 3.5, 0, 2, 3.5, 4.5]
  },
  {
    id: 'rock',
    name: 'Rock',
    description: 'Realza el cuerpo de guitarras eléctricas, cajas y platillos.',
    gains: [5, 3, -1.5, 1.5, 3, 5]
  },
  {
    id: 'hip_hop',
    name: 'Hip-Hop / Trap',
    description: 'Máxima pegada en 808s manteniendo nitidez en voces y flow urbano.',
    gains: [6, 5, 0, 1.5, -1, 2]
  },
  {
    id: 'acoustic',
    name: 'Acústica',
    description: 'Calidez orgánica y claridad natural para guitarras de cuerda y voces acústicas.',
    gains: [3, 2, 1, 2, 3, 3]
  },
  {
    id: 'vocal_boost',
    name: 'Realce vocal',
    description: 'Enfoca las frecuencias medias humanas para máxima inteligibilidad en líricas y podcasts.',
    gains: [-2, -1, 2.5, 4.5, 3, 1]
  },
  {
    id: 'classical',
    name: 'Clásica / Orquestal',
    description: 'Amplitud dinámica natural para conciertos de cámara y orquestas sinfónicas.',
    gains: [4.5, 3, 1.5, 1, 2.5, 4]
  },
  {
    id: 'custom',
    name: 'Personalizado',
    description: 'Ajuste manual individual por bandas de frecuencia.',
    gains: [0, 0, 0, 0, 0, 0]
  }
];

const STORAGE_KEY = 'harmonia_equalizer_v1';

export class EqualizerService {
  private audioCtx: AudioContext | null = null;
  private inputGain: GainNode | null = null;
  private outputGain: GainNode | null = null;
  private filters: BiquadFilterNode[] = [];
  private attachedElements = new WeakSet<HTMLAudioElement>();
  private pendingElements: HTMLAudioElement[] = [];

  private isEnabled: boolean = true;
  private activePresetId: string = 'flat';
  private currentGains: number[] = [0, 0, 0, 0, 0, 0];
  private isGraphReady: boolean = false;

  constructor() {
    this.restoreFromStorage();
  }

  /**
   * Inicializa la cadena de procesamiento de audio si aún no está lista.
   */
  public ensureInitialized(): boolean {
    if (this.isGraphReady && this.audioCtx) return true;
    if (typeof window === 'undefined') return false;

    const AudioContextConstructor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextConstructor) {
      console.warn('EqualizerService: Web Audio API no soportado');
      return false;
    }

    try {
      this.audioCtx = new AudioContextConstructor();
      this.inputGain = this.audioCtx.createGain();
      this.outputGain = this.audioCtx.createGain();

      this.filters = EQUALIZER_BANDS_CONFIG.map((config, index) => {
        const filter = this.audioCtx!.createBiquadFilter();
        filter.type = config.type;
        filter.frequency.value = config.frequency;
        filter.Q.value = 1.0;
        filter.gain.value = this.isEnabled ? this.currentGains[index] : 0;
        return filter;
      });

      // Encadenar en serie: Input -> F0 -> F1 -> F2 -> F3 -> F4 -> F5 -> Output -> Destination
      let lastNode: AudioNode = this.inputGain;
      for (const filter of this.filters) {
        lastNode.connect(filter);
        lastNode = filter;
      }
      lastNode.connect(this.outputGain);
      this.outputGain.connect(this.audioCtx.destination);

      this.isGraphReady = true;

      // Conectar elementos de audio pendientes
      for (const element of this.pendingElements) {
        this.doAttach(element);
      }
      this.pendingElements = [];

      return true;
    } catch (err) {
      console.warn('EqualizerService: Error al inicializar Web Audio graph:', err);
      return false;
    }
  }

  /**
   * Conecta un elemento HTMLAudioElement al gráfico del ecualizador.
   * Seguro frente a reconexiones accidentales gracias a WeakSet.
   */
  public attachAudioElement(audioElement: HTMLAudioElement): void {
    if (this.attachedElements.has(audioElement)) return;

    // Al reproducir, asegurar que el AudioContext pase de 'suspended' a 'running'
    audioElement.addEventListener('play', () => {
      this.resumeContext();
    });

    if (!this.isGraphReady) {
      this.pendingElements.push(audioElement);
      // Intentar inicializar perezosamente
      this.ensureInitialized();
      return;
    }

    this.doAttach(audioElement);
  }

  private doAttach(audioElement: HTMLAudioElement): void {
    if (this.attachedElements.has(audioElement)) return;
    try {
      if (!this.audioCtx || !this.inputGain) return;
      const source = this.audioCtx.createMediaElementSource(audioElement);
      source.connect(this.inputGain);
      this.attachedElements.add(audioElement);
    } catch (err) {
      console.warn('EqualizerService: No se pudo conectar MediaElementSource:', err);
    }
  }

  /**
   * Reanuda el AudioContext si el navegador lo suspendió por política de reproducción automática.
   */
  public async resumeContext(): Promise<void> {
    if (!this.audioCtx) {
      this.ensureInitialized();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      try {
        await this.audioCtx.resume();
      } catch (err) {
        console.warn('EqualizerService: Error al reanudar AudioContext:', err);
      }
    }
  }

  /**
   * Modifica la ganancia en dB de una banda específica (-12 a +12 dB).
   * Aplica un suavizado exponencial suave de 20ms para eliminar pops y distorsiones.
   */
  public setBandGain(bandIndex: number, gainDb: number): void {
    if (bandIndex < 0 || bandIndex >= 6) return;
    const clampedGain = Math.max(-12, Math.min(12, Math.round(gainDb * 2) / 2));
    this.currentGains[bandIndex] = clampedGain;

    if (this.isGraphReady && this.audioCtx && this.filters[bandIndex]) {
      const targetGain = this.isEnabled ? clampedGain : 0;
      const now = this.audioCtx.currentTime;
      const filter = this.filters[bandIndex];
      filter.gain.cancelScheduledValues(now);
      filter.gain.setTargetAtTime(targetGain, now, 0.02);
    }

    this.activePresetId = 'custom';
    this.persistToStorage();
  }

  /**
   * Aplica un arreglo completo de 6 ganancias simultáneas (Preset).
   */
  public applyGains(gains: number[], presetId: string = 'custom'): void {
    for (let i = 0; i < 6; i++) {
      const val = gains[i] !== undefined ? gains[i] : 0;
      this.currentGains[i] = Math.max(-12, Math.min(12, val));

      if (this.isGraphReady && this.audioCtx && this.filters[i]) {
        const targetGain = this.isEnabled ? this.currentGains[i] : 0;
        const now = this.audioCtx.currentTime;
        this.filters[i].gain.cancelScheduledValues(now);
        this.filters[i].gain.setTargetAtTime(targetGain, now, 0.025);
      }
    }

    this.activePresetId = presetId;
    this.persistToStorage();
  }

  /**
   * Aplica un preset oficial de Spotify por su ID.
   */
  public applyPreset(presetId: string): void {
    const preset = SPOTIFY_EQ_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    this.applyGains([...preset.gains], preset.id);
  }

  /**
   * Activa o desactiva (Bypass) el ecualizador sin cortar el flujo de audio.
   * Al desactivar, todos los filtros se ajustan suavemente a 0 dB sin desconectar nodos.
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;

    if (this.isGraphReady && this.audioCtx) {
      const now = this.audioCtx.currentTime;
      this.filters.forEach((filter, index) => {
        const target = enabled ? this.currentGains[index] : 0;
        filter.gain.cancelScheduledValues(now);
        filter.gain.setTargetAtTime(target, now, 0.03);
      });
    }

    this.persistToStorage();
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  public getActivePresetId(): string {
    return this.activePresetId;
  }

  public getBands(): EqualizerBand[] {
    return EQUALIZER_BANDS_CONFIG.map((conf, index) => ({
      ...conf,
      gain: this.currentGains[index]
    }));
  }

  public getCurrentGains(): number[] {
    return [...this.currentGains];
  }

  public resetToFlat(): void {
    this.applyPreset('flat');
  }

  private persistToStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const data = {
        isEnabled: this.isEnabled,
        activePresetId: this.activePresetId,
        gains: this.currentGains
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('EqualizerService: No se pudo guardar configuración en localStorage:', e);
    }
  }

  private restoreFromStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (typeof parsed.isEnabled === 'boolean') {
        this.isEnabled = parsed.isEnabled;
      }
      if (typeof parsed.activePresetId === 'string') {
        this.activePresetId = parsed.activePresetId;
      }
      if (Array.isArray(parsed.gains) && parsed.gains.length === 6) {
        this.currentGains = parsed.gains.map((g: number) =>
          typeof g === 'number' && !isNaN(g) ? Math.max(-12, Math.min(12, g)) : 0
        );
      }
    } catch (e) {
      console.warn('EqualizerService: Error al recuperar datos de localStorage:', e);
    }
  }
}

export const defaultEqualizerService = new EqualizerService();
