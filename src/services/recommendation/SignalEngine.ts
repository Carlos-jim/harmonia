import { Track } from '../../types';
import { UserTasteProfile, TrackSignalEvent } from '../../types/recommendation';
import { databaseService } from '../storage/DatabaseService';

const STORAGE_KEY = 'harmonia_taste_profile_v1';
const RECENT_EVENTS_KEY = 'harmonia_recent_signals_v1';

/**
 * Motor de Señales de Usuario (Signal Engine):
 * Inspirado en el UBI (Ubiquitous Behavioral Instrumentation) y la regla de 30 segundos
 * de Spotify revelada mediante ingeniería inversa con REA.
 */
export class SignalEngine {
  private profile: UserTasteProfile;
  private currentPlayStartTime: number = 0;
  private currentPlayingTrack: Track | null = null;
  private currentTrackQualified: boolean = false;
  private recentEvents: TrackSignalEvent[] = [];
  private artistDisplayNames: Record<string, string> = {};
  private listeners: Set<(profile: UserTasteProfile) => void> = new Set();

  constructor() {
    this.profile = this.loadProfile();
    this.recentEvents = this.loadRecentEvents();
    for (const ev of this.recentEvents) {
      if (ev.artist) {
        this.artistDisplayNames[ev.artist.trim().toLowerCase()] = ev.artist.trim();
      }
    }
    this.initDatabase();
  }

  private async initDatabase() {
    try {
      await databaseService.init();
      const dbProfile = await databaseService.loadTasteProfile();
      if (dbProfile && (dbProfile.totalPlays > 0 || Object.keys(dbProfile.artistAffinities).length > 0)) {
        this.profile = dbProfile;
      }
      const dbEvents = await databaseService.getRecentSignals(50);
      if (dbEvents && dbEvents.length > 0) {
        this.recentEvents = dbEvents;
        for (const ev of dbEvents) {
          if (ev.artist) {
            this.artistDisplayNames[ev.artist.trim().toLowerCase()] = ev.artist.trim();
          }
        }
      }
      this.notifyListeners();
    } catch (e) {
      console.warn('DatabaseService init error in SignalEngine:', e);
    }
  }

  private loadProfile(): UserTasteProfile {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          artistAffinities: parsed.artistAffinities || {},
          trackAffinities: parsed.trackAffinities || {},
          transitionMatrix: parsed.transitionMatrix || {},
          totalPlays: parsed.totalPlays || 0,
          totalSkips: parsed.totalSkips || 0,
          totalListenedSeconds: parsed.totalListenedSeconds || 0,
          hourlyPlays: parsed.hourlyPlays || new Array(24).fill(0)
        };
      }
    } catch (e) {
      console.warn('Error loading taste profile from localStorage:', e);
    }

    return {
      artistAffinities: {},
      trackAffinities: {},
      transitionMatrix: {},
      totalPlays: 0,
      totalSkips: 0,
      totalListenedSeconds: 0,
      hourlyPlays: new Array(24).fill(0)
    };
  }

  private loadRecentEvents(): TrackSignalEvent[] {
    try {
      const raw = localStorage.getItem(RECENT_EVENTS_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Error loading recent signals:', e);
    }
    return [];
  }

  private persistProfile() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
      localStorage.setItem(RECENT_EVENTS_KEY, JSON.stringify(this.recentEvents.slice(-50)));
    } catch (e) {
      console.warn('Error saving taste profile to localStorage:', e);
    }
    databaseService.saveTasteProfile(this.profile).catch(() => {});
  }

  /**
   * Se invoca cuando una canción empieza a reproducirse.
   */
  public onTrackStart(track: Track) {
    this.currentPlayStartTime = Date.now();
    this.currentPlayingTrack = track;
    this.currentTrackQualified = false;
    if (track?.artist) {
      const clean = track.artist.trim().toLowerCase();
      if (clean) this.artistDisplayNames[clean] = track.artist.trim();
    }
    this.notifyListeners();
  }

  public getCurrentPlayingTrack(): Track | null {
    return this.currentPlayingTrack;
  }

  /**
   * Hito de los 30 segundos (Spotify Stream Qualification Milestone):
   * En los sistemas de recomendación implícita de Spotify (ALS y BaRT), superar los 30 segundos
   * califica la reproducción como un stream oficial y señal de afinidad positiva instantánea.
   * Se invoca en tiempo real sin requerir que la pista termine.
   */
  public onThirtySecondsMilestone(track: Track) {
    if (!track || !track.id) return;
    if (this.currentTrackQualified) return;
    if (this.currentPlayingTrack && this.currentPlayingTrack.id !== track.id) return;

    this.currentTrackQualified = true;

    if (track.artist) {
      const clean = track.artist.trim().toLowerCase();
      if (clean) this.artistDisplayNames[clean] = track.artist.trim();
    }

    // Otorga afinidad positiva inmediata en tiempo real
    this.adjustArtistAffinity(track.artist, 2.5);
    this.adjustTrackAffinity(track.id, 2.0);
    this.profile.totalPlays = (this.profile.totalPlays || 0) + 1;

    this.recordSignal(track, 'listen_completed', 30, track.duration || 180);
    this.persistProfile();
    this.notifyListeners();
  }

  /**
   * Se invoca cuando se cambia o termina una canción.
   * Aplica la regla estricta de Spotify de los 30 segundos.
   */
  public onTrackEndOrChange(
    previousTrack: Track | null,
    nextTrack: Track | null,
    currentTime: number,
    duration: number,
    naturalEnd: boolean = false
  ) {
    const track = previousTrack || this.currentPlayingTrack;
    if (!track) return;

    if (track.artist) {
      const clean = track.artist.trim().toLowerCase();
      if (clean) this.artistDisplayNames[clean] = track.artist.trim();
    }

    const fallbackElapsed = this.currentPlayStartTime ? (Date.now() - this.currentPlayStartTime) / 1000 : 0;
    const listenedSeconds = Math.max(0, currentTime || fallbackElapsed);
    const isDurationValid = duration > 40;
    const wasQualified = this.currentTrackQualified;

    // REGLA DE LOS 30 SEGUNDOS (Spotify ALS implicit feedback rule)
    if (!wasQualified && !naturalEnd && isDurationValid && listenedSeconds < 30) {
      // SKIP TEMPRANO (< 30s y sin haber calificado): Señal negativa estricta
      this.recordSignal(track, 'skip_early', listenedSeconds, duration);
      this.profile.totalSkips = (this.profile.totalSkips || 0) + 1;

      // Penalizaciones
      this.adjustArtistAffinity(track.artist, -1.5);
      this.adjustTrackAffinity(track.id, -2.5);
    } else {
      // ESCUCHA EXITOSA (>= 30s o final natural): Señal positiva
      if (!wasQualified) {
        this.currentTrackQualified = true;
        this.adjustArtistAffinity(track.artist, 2.0);
        this.adjustTrackAffinity(track.id, 1.5);
        this.profile.totalPlays = (this.profile.totalPlays || 0) + 1;
      } else if (naturalEnd) {
        // Bonus por completar la pista hasta el final
        this.adjustArtistAffinity(track.artist, 1.0);
      }

      this.recordSignal(track, 'listen_completed', listenedSeconds, duration);

      // Si hay una siguiente canción, registramos la transición en el Grafo de Markov
      if (nextTrack && nextTrack.id !== track.id) {
        if (!this.profile.transitionMatrix[track.id]) {
          this.profile.transitionMatrix[track.id] = {};
        }
        const currentCount = this.profile.transitionMatrix[track.id][nextTrack.id] || 0;
        this.profile.transitionMatrix[track.id][nextTrack.id] = currentCount + 1;
      }
    }

    // Resetear flag para la siguiente pista
    this.currentTrackQualified = false;

    // Acumular tiempo real de escucha en segundos
    this.profile.totalListenedSeconds = (this.profile.totalListenedSeconds || 0) + Math.round(listenedSeconds);

    // Registrar hora del día de la reproducción (0 a 23)
    const currentHour = new Date().getHours();
    if (!this.profile.hourlyPlays) {
      this.profile.hourlyPlays = new Array(24).fill(0);
    }
    this.profile.hourlyPlays[currentHour] = (this.profile.hourlyPlays[currentHour] || 0) + 1;

    this.persistProfile();
    this.notifyListeners();
  }

  /**
   * Registra cuando el usuario da Like o quita Like (Señal de máxima confianza).
   */
  public onToggleLike(track: Track, isLikedNow: boolean) {
    const signal = isLikedNow ? 'like' : 'unlike';
    this.recordSignal(track, signal, 0, track.duration);

    if (track.artist) {
      const clean = track.artist.trim().toLowerCase();
      if (clean) this.artistDisplayNames[clean] = track.artist.trim();
    }

    const deltaArtist = isLikedNow ? 3.0 : -2.0;
    const deltaTrack = isLikedNow ? 5.0 : -3.5;

    this.adjustArtistAffinity(track.artist, deltaArtist);
    this.adjustTrackAffinity(track.id, deltaTrack);

    this.persistProfile();
    this.notifyListeners();
  }

  private recordSignal(
    track: Track,
    type: TrackSignalEvent['type'],
    listenedSeconds: number,
    duration: number
  ) {
    if (track.artist) {
      const clean = track.artist.trim().toLowerCase();
      if (clean) this.artistDisplayNames[clean] = track.artist.trim();
    }

    const event: TrackSignalEvent = {
      trackId: track.id,
      artist: track.artist,
      genre: track.genre,
      timestamp: Date.now(),
      duration,
      listenedSeconds,
      type
    };

    this.recentEvents.push(event);
    if (this.recentEvents.length > 100) {
      this.recentEvents.shift();
    }
    databaseService.recordSignal(event).catch(() => {});
  }

  private adjustArtistAffinity(artist: string, delta: number) {
    const cleanArtist = artist.trim().toLowerCase();
    if (!cleanArtist) return;

    if (!this.artistDisplayNames[cleanArtist]) {
      this.artistDisplayNames[cleanArtist] = artist.trim();
    }

    const current = this.profile.artistAffinities[cleanArtist] || 0;
    // Límites acotados [-15, +100]
    this.profile.artistAffinities[cleanArtist] = Math.max(-15, Math.min(100, current + delta));
  }

  private adjustTrackAffinity(trackId: string, delta: number) {
    const current = this.profile.trackAffinities[trackId] || 0;
    this.profile.trackAffinities[trackId] = Math.max(-20, Math.min(100, current + delta));
  }

  // --- PUB/SUB REACTIVO PARA VISTAS (HomeView, etc.) ---

  public subscribe(listener: (profile: UserTasteProfile) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    for (const listener of this.listeners) {
      try {
        listener(this.profile);
      } catch (err) {
        console.warn('Error in SignalEngine listener:', err);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('harmonia:taste-updated', { detail: { profile: this.profile } })
      );
    }
  }

  // --- MÉTODOS DE CONSULTA PARA EL MOTOR DE RECOMENDACIÓN ---

  public getArtistAffinity(artist: string): number {
    const clean = artist.trim().toLowerCase();
    let score = this.profile.artistAffinities[clean] || 0;

    // Recency boost para evaluación de candidatos
    const now = Date.now();
    for (const ev of this.recentEvents) {
      if (ev.artist && ev.artist.trim().toLowerCase() === clean) {
        const ageHours = (now - ev.timestamp) / (1000 * 60 * 60);
        if (ageHours <= 2) {
          score += ev.type === 'skip_early' ? -2.0 : 4.0;
        } else if (ageHours <= 24) {
          score += ev.type === 'skip_early' ? -1.0 : 2.0;
        }
      }
    }

    if (this.currentPlayingTrack && this.currentPlayingTrack.artist) {
      if (this.currentPlayingTrack.artist.trim().toLowerCase() === clean) {
        score += 5.0;
      }
    }

    return score;
  }

  public getTrackAffinity(trackId: string): number {
    return this.profile.trackAffinities[trackId] || 0;
  }

  public getTransitionProbability(fromTrackId: string, toTrackId: string): number {
    const row = this.profile.transitionMatrix[fromTrackId];
    if (!row) return 0;

    const toCount = row[toTrackId] || 0;
    if (toCount === 0) return 0;

    const totalTransitions = Object.values(row).reduce((acc, v) => acc + v, 0);
    return totalTransitions > 0 ? toCount / totalTransitions : 0;
  }

  /**
   * Obtiene los artistas principales ponderando la base acumulada con la sesión activa
   * y recency weighting (Modelo BaRT de Spotify).
   */
  public getTopArtists(limit = 6): { artist: string; score: number }[] {
    const scores: Record<string, number> = {};

    // 1. Base acumulada histórica
    for (const [artist, baseScore] of Object.entries(this.profile.artistAffinities)) {
      scores[artist] = (scores[artist] || 0) + baseScore;
    }

    // 2. Sesión reciente / Recency weighting (últimas horas)
    const now = Date.now();
    for (const ev of this.recentEvents) {
      if (!ev.artist) continue;
      const cleanArtist = ev.artist.trim().toLowerCase();
      if (!cleanArtist) continue;

      if (!this.artistDisplayNames[cleanArtist]) {
        this.artistDisplayNames[cleanArtist] = ev.artist.trim();
      }

      const ageHours = (now - ev.timestamp) / (1000 * 60 * 60);
      if (ageHours <= 2) {
        // En las últimas 2 horas (sesión activa actual): peso multiplicativo
        const weight = ev.type === 'skip_early' ? -2.0 : 4.0;
        scores[cleanArtist] = (scores[cleanArtist] || 0) + weight;
      } else if (ageHours <= 24) {
        // En las últimas 24 horas
        const weight = ev.type === 'skip_early' ? -1.0 : 2.0;
        scores[cleanArtist] = (scores[cleanArtist] || 0) + weight;
      }
    }

    // 3. Artista en reproducción activa (Focus de la sesión actual en vivo)
    if (this.currentPlayingTrack && this.currentPlayingTrack.artist) {
      const activeArtist = this.currentPlayingTrack.artist.trim().toLowerCase();
      if (activeArtist) {
        if (!this.artistDisplayNames[activeArtist]) {
          this.artistDisplayNames[activeArtist] = this.currentPlayingTrack.artist.trim();
        }
        const maxExisting = Object.values(scores).length > 0 ? Math.max(...Object.values(scores)) : 0;
        scores[activeArtist] = Math.max((scores[activeArtist] || 0) + 15.0, maxExisting + 5.0);
      }
    }

    return Object.entries(scores)
      .map(([cleanArtist, score]) => {
        const displayName =
          this.artistDisplayNames[cleanArtist] ||
          cleanArtist
            .split(' ')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
        return { artist: displayName, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  public getProfileStats() {
    return {
      totalPlays: this.profile.totalPlays,
      totalSkips: this.profile.totalSkips,
      trackedArtists: Object.keys(this.profile.artistAffinities).length,
      trackedTransitions: Object.keys(this.profile.transitionMatrix).length
    };
  }

  public getTotalListenedMinutes(): number {
    return Math.round((this.profile.totalListenedSeconds || 0) / 60);
  }

  public getSatisfactionRate(): number {
    const total = this.profile.totalPlays + this.profile.totalSkips;
    if (total === 0) return 100;
    return Math.round((this.profile.totalPlays / total) * 100);
  }

  public getHourlyDistribution(): number[] {
    return this.profile.hourlyPlays || new Array(24).fill(0);
  }

  public getTasteProfile(): UserTasteProfile {
    return { ...this.profile };
  }

  public getRecentEvents(): TrackSignalEvent[] {
    return [...this.recentEvents];
  }

  public clearTelemetry() {
    this.profile = {
      artistAffinities: {},
      trackAffinities: {},
      transitionMatrix: {},
      totalPlays: 0,
      totalSkips: 0,
      totalListenedSeconds: 0,
      hourlyPlays: new Array(24).fill(0)
    };
    this.recentEvents = [];
    this.persistProfile();
  }
}

export const signalEngine = new SignalEngine();
