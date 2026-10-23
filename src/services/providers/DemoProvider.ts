import { IMusicProvider } from '../../contracts/provider';
import { SAMPLE_PLAYLISTS, SAMPLE_TRACKS } from '../../data/mockData';
import { Track, Playlist } from '../../types';

/**
 * Single Responsibility Principle (SRP) & Liskov Substitution Principle (LSP):
 * Proveedor de demostración que suministra pistas libres sin conexión externa.
 * Cumple 100% el contrato IMusicProvider y maneja creación de playlists y favoritos en memoria.
 */
export class DemoProvider implements IMusicProvider {
  readonly id = 'demo';
  readonly displayName = 'Modo Demo (Pistas Libres)';

  private playlists: Playlist[] = [...SAMPLE_PLAYLISTS];
  private starredIds: Set<string> = new Set(['track-1', 'track-3']);

  async ping(): Promise<boolean> {
    return true; // Siempre disponible en local
  }

  async getPlaylists(): Promise<Playlist[]> {
    return this.playlists;
  }

  async getAlbums(): Promise<Playlist[]> {
    return this.playlists;
  }

  async getPlaylistTracks(playlistId: string): Promise<Track[]> {
    const pl = this.playlists.find((p) => p.id === playlistId);
    return pl ? pl.tracks : SAMPLE_TRACKS;
  }

  async search(query: string): Promise<Track[]> {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return SAMPLE_TRACKS.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q) ||
        (t.genre && t.genre.toLowerCase().includes(q))
    );
  }

  getStreamUrl(trackId: string): string {
    const track = SAMPLE_TRACKS.find((t) => t.id === trackId);
    return track?.audioUrl || '';
  }

  getCoverArtUrl(coverArtId: string): string {
    const track = SAMPLE_TRACKS.find((t) => t.id === coverArtId);
    return track?.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60';
  }

  async createPlaylist(name: string): Promise<Playlist> {
    const newPl: Playlist = {
      id: `demo-pl-${Date.now()}`,
      title: name,
      description: 'Playlist creada por el usuario',
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60',
      tracks: []
    };
    this.playlists = [newPl, ...this.playlists];
    return newPl;
  }

  async addTrackToPlaylist(playlistId: string, trackId: string): Promise<void> {
    const pl = this.playlists.find((p) => p.id === playlistId);
    const track = SAMPLE_TRACKS.find((t) => t.id === trackId);
    if (pl && track && !pl.tracks.some((t) => t.id === trackId)) {
      pl.tracks = [...pl.tracks, track];
    }
  }

  async starTrack(trackId: string): Promise<void> {
    this.starredIds.add(trackId);
  }

  async unstarTrack(trackId: string): Promise<void> {
    this.starredIds.delete(trackId);
  }

  async getStarredTracks(): Promise<Track[]> {
    return SAMPLE_TRACKS.filter((t) => this.starredIds.has(t.id));
  }
}
