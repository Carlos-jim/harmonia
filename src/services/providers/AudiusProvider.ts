import { IMusicProvider } from '../../contracts/provider';
import { Track, Playlist } from '../../types';

interface AudiusTrackRaw {
  id: string;
  title: string;
  duration: number;
  user?: {
    name?: string;
  };
  artwork?: {
    '150x150'?: string;
    '480x480'?: string;
    '1000x1000'?: string;
  };
  genre?: string;
}

interface AudiusPlaylistRaw {
  id: string;
  playlist_name: string;
  description?: string;
  artwork?: {
    '150x150'?: string;
    '480x480'?: string;
    '1000x1000'?: string;
  };
  total_play_count?: number;
}

/**
 * Open/Closed Principle (OCP) & Liskov Substitution Principle (LSP):
 * Proveedor de catálogo en línea conectado a la red pública y abierta de Audius.
 * Permite buscar entre millones de canciones y artistas reales en streaming inmediato
 * sin necesidad de credenciales ni configuración previa.
 */
export class AudiusProvider implements IMusicProvider {
  readonly id = 'audius';
  readonly displayName = 'Catálogo Global Online (Audius)';

  private apiBase = 'https://discoveryprovider.audius.co/v1';
  private appName = 'HarmoniaMusic';
  private customPlaylists: Playlist[] = [];
  private starredIds: Set<string> = new Set();

  async ping(): Promise<boolean> {
    try {
      const res = await fetch(`${this.apiBase}/tracks/trending?app_name=${this.appName}&limit=1`);
      return res.ok;
    } catch {
      return false;
    }
  }

  private mapRawTrack(raw: AudiusTrackRaw): Track {
    const coverUrl =
      raw.artwork?.['480x480'] ||
      raw.artwork?.['150x150'] ||
      raw.artwork?.['1000x1000'] ||
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60';

    return {
      id: raw.id,
      title: raw.title,
      artist: raw.user?.name || 'Artista Desconocido',
      album: 'Sencillo / Audius Stream',
      duration: raw.duration || 180,
      coverUrl,
      audioUrl: this.getStreamUrl(raw.id),
      genre: raw.genre || 'Varios'
    };
  }

  async search(query: string): Promise<Track[]> {
    const q = encodeURIComponent(query.trim());
    if (!q) return [];

    try {
      const res = await fetch(`${this.apiBase}/tracks/search?query=${q}&app_name=${this.appName}&limit=35`);
      if (!res.ok) return [];

      const json = await res.json();
      const rawTracks: AudiusTrackRaw[] = json.data || [];
      return rawTracks.map((t) => this.mapRawTrack(t));
    } catch (err) {
      console.warn('Audius search error:', err);
      return [];
    }
  }

  async getPlaylists(): Promise<Playlist[]> {
    try {
      const res = await fetch(`${this.apiBase}/playlists/trending?app_name=${this.appName}&limit=12`);
      if (!res.ok) return this.customPlaylists;

      const json = await res.json();
      const rawPlaylists: AudiusPlaylistRaw[] = json.data || [];

      const audiusPlaylists: Playlist[] = rawPlaylists.map((p) => ({
        id: `pl-${p.id}`,
        title: p.playlist_name,
        description: p.description || 'Playlist en tendencia en la red global',
        coverUrl:
          p.artwork?.['480x480'] ||
          p.artwork?.['150x150'] ||
          'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60',
        tracks: []
      }));

      return [...this.customPlaylists, ...audiusPlaylists];
    } catch (err) {
      console.warn('Error fetching Audius playlists:', err);
      return this.customPlaylists;
    }
  }

  async getAlbums(): Promise<Playlist[]> {
    try {
      const res = await fetch(`${this.apiBase}/tracks/trending?app_name=${this.appName}&limit=20`);
      if (!res.ok) return [];

      const json = await res.json();
      const rawTracks: AudiusTrackRaw[] = json.data || [];
      const tracks = rawTracks.map((t) => this.mapRawTrack(t));

      return [
        {
          id: 'album-trending-global',
          title: 'Top Éxitos Globales',
          description: 'Las 20 canciones más escuchadas hoy en la red abierta',
          coverUrl: tracks[0]?.coverUrl || '',
          tracks
        }
      ];
    } catch (err) {
      console.warn('Error fetching Audius trending album:', err);
      return [];
    }
  }

  async getPlaylistTracks(playlistId: string): Promise<Track[]> {
    const rawId = playlistId.replace(/^pl-/, '').replace(/^album-/, '');

    // Si es la lista en tendencia global
    if (playlistId === 'album-trending-global') {
      const albums = await this.getAlbums();
      return albums[0]?.tracks || [];
    }

    // Si es una lista personalizada creada por el usuario
    const custom = this.customPlaylists.find((p) => p.id === playlistId);
    if (custom) {
      return custom.tracks;
    }

    // Consulta a la red de Audius
    try {
      const res = await fetch(`${this.apiBase}/playlists/${rawId}/tracks?app_name=${this.appName}`);
      if (!res.ok) return [];

      const json = await res.json();
      const rawTracks: AudiusTrackRaw[] = json.data || [];
      return rawTracks.map((t) => this.mapRawTrack(t));
    } catch (err) {
      console.warn('Error fetching playlist tracks from Audius:', err);
      return [];
    }
  }

  getStreamUrl(trackId: string): string {
    return `${this.apiBase}/tracks/${trackId}/stream?app_name=${this.appName}`;
  }

  getCoverArtUrl(coverArtId: string): string {
    return coverArtId;
  }

  async createPlaylist(name: string): Promise<Playlist> {
    const newPlaylist: Playlist = {
      id: `custom-${Date.now()}`,
      title: name,
      description: 'Playlist personalizada en la nube',
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60',
      tracks: []
    };
    this.customPlaylists = [newPlaylist, ...this.customPlaylists];
    return newPlaylist;
  }

  async addTrackToPlaylist(playlistId: string, trackId: string): Promise<void> {
    const pl = this.customPlaylists.find((p) => p.id === playlistId);
    if (pl && !pl.tracks.some((t) => t.id === trackId)) {
      // Buscar información del track o rellenar básico
      pl.tracks = [
        ...pl.tracks,
        {
          id: trackId,
          title: 'Pista guardada',
          artist: 'Audius Stream',
          album: pl.title,
          duration: 180,
          coverUrl: pl.coverUrl,
          audioUrl: this.getStreamUrl(trackId)
        }
      ];
    }
  }

  async starTrack(trackId: string): Promise<void> {
    this.starredIds.add(trackId);
  }

  async unstarTrack(trackId: string): Promise<void> {
    this.starredIds.delete(trackId);
  }

  async getStarredTracks(): Promise<Track[]> {
    return [];
  }
}
