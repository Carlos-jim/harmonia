import Database from '@tauri-apps/plugin-sql';
import { UserTasteProfile, TrackSignalEvent } from '../../types/recommendation';

const STORAGE_PROFILE_KEY = 'harmonia_taste_profile_v1';
const STORAGE_SIGNALS_KEY = 'harmonia_recent_signals_v1';

/**
 * Servicio de Base de Datos Nativa SQLite con soporte híbrido:
 * - Modo Nativo Tauri: Conexión persistente de alto rendimiento a `sqlite:harmonia.db`.
 * - Modo Navegador (Dev fallback): Almacenamiento seguro en localStorage/in-memory para que
 *   el desarrollo en navegador web continúe funcionando sin interrupciones.
 */
export class DatabaseService {
  private db: Database | null = null;
  private isTauriEnv: boolean = false;
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.isTauriEnv = typeof window !== 'undefined' && Boolean((window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__);
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      if (this.isTauriEnv) {
        try {
          this.db = await Database.load('sqlite:harmonia.db');
          await this.createTables();
          await this.migrateFromLocalStorage();
          this.isInitialized = true;
          return;
        } catch (err) {
          console.warn('SQLite init failed in Tauri environment, falling back to storage:', err);
          this.db = null;
        }
      }
      this.isInitialized = true;
    })();

    return this.initPromise;
  }

  private async createTables(): Promise<void> {
    if (!this.db) return;

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS taste_profile (
        id TEXT PRIMARY KEY,
        total_plays INTEGER DEFAULT 0,
        total_skips INTEGER DEFAULT 0,
        total_listened_seconds INTEGER DEFAULT 0,
        hourly_plays TEXT,
        updated_at INTEGER
      );
    `);

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS artist_affinities (
        artist TEXT PRIMARY KEY,
        score REAL NOT NULL,
        updated_at INTEGER
      );
    `);

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS track_affinities (
        track_id TEXT PRIMARY KEY,
        score REAL NOT NULL,
        updated_at INTEGER
      );
    `);

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS markov_transitions (
        from_track TEXT NOT NULL,
        to_track TEXT NOT NULL,
        count INTEGER DEFAULT 1,
        PRIMARY KEY (from_track, to_track)
      );
    `);

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS track_signals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        track_id TEXT NOT NULL,
        artist TEXT NOT NULL,
        genre TEXT,
        timestamp INTEGER NOT NULL,
        duration REAL NOT NULL,
        listened_seconds REAL NOT NULL,
        type TEXT NOT NULL
      );
    `);

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
  }

  private async migrateFromLocalStorage(): Promise<void> {
    if (!this.db) return;

    try {
      const rawProfile = localStorage.getItem(STORAGE_PROFILE_KEY);
      if (rawProfile) {
        const parsed: UserTasteProfile = JSON.parse(rawProfile);
        const existing = await this.db.select<{ id: string }[]>('SELECT id FROM taste_profile WHERE id = $1', ['main']);
        if (existing.length === 0) {
          await this.saveTasteProfile(parsed);
        }
      }

      const rawSignals = localStorage.getItem(STORAGE_SIGNALS_KEY);
      if (rawSignals) {
        const signals: TrackSignalEvent[] = JSON.parse(rawSignals);
        const countRes = await this.db.select<{ count: number }[]>('SELECT COUNT(*) as count FROM track_signals');
        if (countRes.length > 0 && countRes[0].count === 0) {
          for (const ev of signals) {
            await this.recordSignal(ev);
          }
        }
      }
    } catch (e) {
      console.warn('Error during migration to SQLite:', e);
    }
  }

  public async saveTasteProfile(profile: UserTasteProfile): Promise<void> {
    await this.init();

    // Siempre persistimos también en localStorage como salvaguarda
    try {
      localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(profile));
    } catch {
      // ignore
    }

    if (!this.db) return;

    try {
      const now = Date.now();
      const hourlyJson = JSON.stringify(profile.hourlyPlays || new Array(24).fill(0));

      await this.db.execute(
        `INSERT INTO taste_profile (id, total_plays, total_skips, total_listened_seconds, hourly_plays, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT(id) DO UPDATE SET
           total_plays = excluded.total_plays,
           total_skips = excluded.total_skips,
           total_listened_seconds = excluded.total_listened_seconds,
           hourly_plays = excluded.hourly_plays,
           updated_at = excluded.updated_at`,
        ['main', profile.totalPlays, profile.totalSkips, profile.totalListenedSeconds, hourlyJson, now]
      );

      // Guardar afinidades de artistas
      for (const [artist, score] of Object.entries(profile.artistAffinities)) {
        await this.db.execute(
          `INSERT INTO artist_affinities (artist, score, updated_at)
           VALUES ($1, $2, $3)
           ON CONFLICT(artist) DO UPDATE SET score = excluded.score, updated_at = excluded.updated_at`,
          [artist, score, now]
        );
      }

      // Guardar afinidades de pistas
      for (const [trackId, score] of Object.entries(profile.trackAffinities)) {
        await this.db.execute(
          `INSERT INTO track_affinities (track_id, score, updated_at)
           VALUES ($1, $2, $3)
           ON CONFLICT(track_id) DO UPDATE SET score = excluded.score, updated_at = excluded.updated_at`,
          [trackId, score, now]
        );
      }

      // Guardar transiciones de Markov
      for (const [fromTrack, toMap] of Object.entries(profile.transitionMatrix)) {
        for (const [toTrack, count] of Object.entries(toMap)) {
          await this.db.execute(
            `INSERT INTO markov_transitions (from_track, to_track, count)
             VALUES ($1, $2, $3)
             ON CONFLICT(from_track, to_track) DO UPDATE SET count = excluded.count`,
            [fromTrack, toTrack, count]
          );
        }
      }
    } catch (err) {
      console.warn('Error saving taste profile to SQLite:', err);
    }
  }

  public async loadTasteProfile(): Promise<UserTasteProfile | null> {
    await this.init();

    if (!this.db) {
      const raw = localStorage.getItem(STORAGE_PROFILE_KEY);
      return raw ? JSON.parse(raw) : null;
    }

    try {
      const rows = await this.db.select<{
        total_plays: number;
        total_skips: number;
        total_listened_seconds: number;
        hourly_plays: string;
      }[]>('SELECT * FROM taste_profile WHERE id = $1', ['main']);

      if (rows.length === 0) {
        const raw = localStorage.getItem(STORAGE_PROFILE_KEY);
        return raw ? JSON.parse(raw) : null;
      }

      const base = rows[0];
      const artistRows = await this.db.select<{ artist: string; score: number }[]>('SELECT artist, score FROM artist_affinities');
      const trackRows = await this.db.select<{ track_id: string; score: number }[]>('SELECT track_id, score FROM track_affinities');
      const transitionRows = await this.db.select<{ from_track: string; to_track: string; count: number }[]>('SELECT from_track, to_track, count FROM markov_transitions');

      const artistAffinities: Record<string, number> = {};
      for (const r of artistRows) {
        artistAffinities[r.artist] = r.score;
      }

      const trackAffinities: Record<string, number> = {};
      for (const r of trackRows) {
        trackAffinities[r.track_id] = r.score;
      }

      const transitionMatrix: Record<string, Record<string, number>> = {};
      for (const r of transitionRows) {
        if (!transitionMatrix[r.from_track]) {
          transitionMatrix[r.from_track] = {};
        }
        transitionMatrix[r.from_track][r.to_track] = r.count;
      }

      let hourlyPlays = new Array(24).fill(0);
      try {
        if (base.hourly_plays) hourlyPlays = JSON.parse(base.hourly_plays);
      } catch {
        // fallback
      }

      return {
        artistAffinities,
        trackAffinities,
        transitionMatrix,
        totalPlays: base.total_plays || 0,
        totalSkips: base.total_skips || 0,
        totalListenedSeconds: base.total_listened_seconds || 0,
        hourlyPlays
      };
    } catch (err) {
      console.warn('Error reading taste profile from SQLite, falling back:', err);
      const raw = localStorage.getItem(STORAGE_PROFILE_KEY);
      return raw ? JSON.parse(raw) : null;
    }
  }

  public async recordSignal(event: TrackSignalEvent): Promise<void> {
    await this.init();

    if (!this.db) return;

    try {
      await this.db.execute(
        `INSERT INTO track_signals (track_id, artist, genre, timestamp, duration, listened_seconds, type)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          event.trackId,
          event.artist,
          event.genre || '',
          event.timestamp,
          event.duration,
          event.listenedSeconds,
          event.type
        ]
      );
    } catch (err) {
      console.warn('Error inserting track signal in SQLite:', err);
    }
  }

  public async getRecentSignals(limit = 100): Promise<TrackSignalEvent[]> {
    await this.init();

    if (!this.db) {
      const raw = localStorage.getItem(STORAGE_SIGNALS_KEY);
      return raw ? JSON.parse(raw) : [];
    }

    try {
      const rows = await this.db.select<{
        track_id: string;
        artist: string;
        genre: string;
        timestamp: number;
        duration: number;
        listened_seconds: number;
        type: TrackSignalEvent['type'];
      }[]>(
        'SELECT track_id, artist, genre, timestamp, duration, listened_seconds, type FROM track_signals ORDER BY id DESC LIMIT $1',
        [limit]
      );

      return rows.map((r) => ({
        trackId: r.track_id,
        artist: r.artist,
        genre: r.genre,
        timestamp: r.timestamp,
        duration: r.duration,
        listenedSeconds: r.listened_seconds,
        type: r.type
      }));
    } catch (err) {
      console.warn('Error fetching signals from SQLite:', err);
      return [];
    }
  }

  public isUsingSqlite(): boolean {
    return Boolean(this.db);
  }
}

export const databaseService = new DatabaseService();
