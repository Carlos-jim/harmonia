import { IMusicProvider } from '../../contracts/provider';
import { SubsonicService, SubsonicConfig } from '../subsonic';
import { Track, Playlist } from '../../types';

/**
 * Single Responsibility Principle (SRP) & Liskov Substitution Principle (LSP):
 * Proveedor que conecta y traduce la API de Subsonic / Navidrome
 * a los contratos universales de Harmonia.
 */
export class SubsonicProvider implements IMusicProvider {
  readonly id = 'subsonic';
  readonly displayName = 'Servidor Navidrome / Subsonic';

  private service: SubsonicService;

  constructor(config: SubsonicConfig) {
    this.service = new SubsonicService(config);
  }

  async ping(): Promise<boolean> {
    return this.service.ping();
  }

  async getPlaylists(): Promise<Playlist[]> {
    return this.service.getPlaylists();
  }

  async getAlbums(type?: 'newest' | 'recent' | 'frequent' | 'random', size?: number): Promise<Playlist[]> {
    return this.service.getAlbumList(type, size);
  }

  async getPlaylistTracks(playlistId: string): Promise<Track[]> {
    return this.service.getPlaylistTracks(playlistId);
  }

  async search(query: string): Promise<Track[]> {
    return this.service.search(query);
  }

  getStreamUrl(trackId: string): string {
    return this.service.getStreamUrl(trackId);
  }

  getCoverArtUrl(coverArtId: string, size: number = 300): string {
    return this.service.getCoverArtUrl(coverArtId, size);
  }

  async createPlaylist(name: string): Promise<Playlist> {
    return this.service.createPlaylist(name);
  }

  async addTrackToPlaylist(playlistId: string, trackId: string): Promise<void> {
    return this.service.addTrackToPlaylist(playlistId, trackId);
  }

  async starTrack(trackId: string): Promise<void> {
    return this.service.star(trackId);
  }

  async unstarTrack(trackId: string): Promise<void> {
    return this.service.unstar(trackId);
  }

  async getStarredTracks(): Promise<Track[]> {
    return this.service.getStarredTracks();
  }
}
