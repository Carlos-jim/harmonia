import { IMusicProvider } from '../../contracts/provider';
import { Track, Playlist } from '../../types';

/**
 * Open/Closed Principle (OCP) & Liskov Substitution Principle (LSP):
 * Proveedor de catálogo oficial basado en YouTube Music (estilo Spotube).
 * Ofrece grabaciones originales de estudio, canciones oficiales de discográficas
 * y descarta automáticamente versiones remix o slowed & chopped de terceros.
 */
export class YouTubeProvider implements IMusicProvider {
  readonly id = 'youtube';
  readonly displayName = 'YouTube Music (Grabaciones Oficiales)';

  private customPlaylists: Playlist[] = [];
  private starredIds: Set<string> = new Set();

  async ping(): Promise<boolean> {
    try {
      const res = await fetch('/api/youtube/search?q=ping');
      return res.ok;
    } catch {
      return false;
    }
  }

  async search(query: string): Promise<Track[]> {
    const q = query.trim();
    if (!q) return [];

    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) return [];

      const tracks: Track[] = await res.json();
      return tracks;
    } catch (err) {
      console.warn('Error fetching YouTube Music search:', err);
      return [];
    }
  }

  async getPlaylists(): Promise<Playlist[]> {
    const defaultPlaylists: Playlist[] = [
      {
        id: 'yt-latin-hits',
        title: 'Éxitos Latinos Oficiales',
        description: 'Lo más escuchado del género urbano, reggaetón y trap latino',
        coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=60',
        tracks: []
      },
      {
        id: 'yt-global-top',
        title: 'Top 50 Global',
        description: 'Las grabaciones oficiales más reproducidas en el mundo',
        coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60',
        tracks: []
      },
      {
        id: 'yt-trap-urbano',
        title: 'Trap & Urbano Frecuencia',
        description: 'Yan Block, Omar Courtz, Cris Mj, Eladio Carrión y más',
        coverUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=60',
        tracks: []
      },
      {
        id: 'yt-hiphop',
        title: 'Hip-Hop & R&B Classics',
        description: 'Pistas de estudio maestras sin modificaciones',
        coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60',
        tracks: []
      }
    ];

    return [...this.customPlaylists, ...defaultPlaylists];
  }

  async getAlbums(): Promise<Playlist[]> {
    // Retornamos colecciones destacadas
    return [
      {
        id: 'album-featured-official',
        title: 'Novedades de Estudio',
        description: 'Álbumes y sencillos oficiales recién estrenados',
        coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&auto=format&fit=crop&q=60',
        tracks: []
      }
    ];
  }

  async getPlaylistTracks(playlistId: string): Promise<Track[]> {
    // Si es una playlist creada por el usuario
    const custom = this.customPlaylists.find((p) => p.id === playlistId);
    if (custom) return custom.tracks;

    let query = 'exitos latinos 2024';
    if (playlistId === 'yt-latin-hits') query = 'exitos latinos 2024';
    else if (playlistId === 'yt-global-top') query = 'top hits global 2024';
    else if (playlistId === 'yt-trap-urbano') query = 'Yan Block Omar Courtz trap';
    else if (playlistId === 'yt-hiphop') query = 'hip hop classics';
    else if (playlistId === 'album-featured-official') query = 'top canciones billboard';

    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) return [];
      const tracks: Track[] = await res.json();
      return tracks;
    } catch (err) {
      console.warn('Error fetching playlist tracks from YouTube:', err);
      return [];
    }
  }

  getStreamUrl(trackId: string): string {
    return `youtube://${trackId}`;
  }

  getCoverArtUrl(coverArtId: string): string {
    return coverArtId;
  }

  async createPlaylist(name: string): Promise<Playlist> {
    const newPlaylist: Playlist = {
      id: `yt-custom-${Date.now()}`,
      title: name,
      description: 'Lista personalizada de YouTube Music',
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60',
      tracks: []
    };
    this.customPlaylists = [newPlaylist, ...this.customPlaylists];
    return newPlaylist;
  }

  async addTrackToPlaylist(playlistId: string, trackId: string): Promise<void> {
    const pl = this.customPlaylists.find((p) => p.id === playlistId);
    if (pl && !pl.tracks.some((t) => t.id === trackId)) {
      pl.tracks.push({
        id: trackId,
        title: 'Pista guardada',
        artist: 'YouTube Music',
        album: pl.title,
        duration: 180,
        coverUrl: pl.coverUrl,
        audioUrl: this.getStreamUrl(trackId)
      });
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
