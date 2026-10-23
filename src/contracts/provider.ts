import { Track, Playlist } from '../types';

/**
 * Interface Segregation Principle (ISP):
 * Interfaces pequeñas y específicas para cada responsabilidad de datos.
 */

export interface ISearchable {
  search(query: string): Promise<Track[]>;
}

export interface IPlaylistRepository {
  getPlaylists(): Promise<Playlist[]>;
  getPlaylistTracks(playlistId: string): Promise<Track[]>;
  createPlaylist(name: string): Promise<Playlist>;
  addTrackToPlaylist(playlistId: string, trackId: string): Promise<void>;
}

export interface IFavoriteRepository {
  starTrack(trackId: string): Promise<void>;
  unstarTrack(trackId: string): Promise<void>;
  getStarredTracks?(): Promise<Track[]>;
}

/**
 * Open/Closed Principle (OCP) & Liskov Substitution Principle (LSP):
 * Cualquier proveedor de música (Subsonic, Demo, Audius, Archivos Locales)
 * debe cumplir este contrato y ser 100% intercambiable.
 */
export interface IMusicProvider extends ISearchable, IPlaylistRepository, IFavoriteRepository {
  readonly id: string;
  readonly displayName: string;

  ping(): Promise<boolean>;
  getAlbums?(type?: 'newest' | 'recent' | 'frequent' | 'random', size?: number): Promise<Playlist[]>;
  getStreamUrl(trackId: string): string;
  getCoverArtUrl(coverArtId: string, size?: number): string;
}
