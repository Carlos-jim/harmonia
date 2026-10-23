import { md5 } from '../utils/md5';
import { Track, Playlist } from '../types';

export interface SubsonicConfig {
  serverUrl: string;
  username: string;
  password?: string;
  token?: string;
  salt?: string;
}

export class SubsonicService {
  private config: SubsonicConfig;
  private clientName = 'HarmoniaMusic';
  private apiVersion = '1.16.1';

  constructor(config: SubsonicConfig) {
    this.config = {
      ...config,
      serverUrl: config.serverUrl.replace(/\/+$/, '')
    };
  }

  private getAuthParams(): URLSearchParams {
    const params = new URLSearchParams();
    params.set('u', this.config.username);
    params.set('v', this.apiVersion);
    params.set('c', this.clientName);
    params.set('f', 'json');

    if (this.config.password) {
      const salt = Math.random().toString(36).substring(2, 12);
      const token = md5(this.config.password + salt);
      params.set('t', token);
      params.set('s', salt);
    }

    return params;
  }

  private async request<T>(endpoint: string, extraParams: Record<string, string> = {}): Promise<T> {
    const params = this.getAuthParams();
    for (const [key, value] of Object.entries(extraParams)) {
      params.set(key, value);
    }

    const url = `${this.config.serverUrl}/rest/${endpoint}?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Subsonic server error: HTTP ${res.status}`);
    }

    const data = await res.json();
    const subsonicResponse = data['subsonic-response'];

    if (subsonicResponse.status !== 'ok') {
      const errorMsg = subsonicResponse.error?.message || 'Error desconocido del servidor';
      throw new Error(`Subsonic error: ${errorMsg}`);
    }

    return subsonicResponse;
  }

  async ping(): Promise<boolean> {
    try {
      await this.request('ping');
      return true;
    } catch (err) {
      console.warn('Ping failed:', err);
      return false;
    }
  }

  getStreamUrl(trackId: string): string {
    const params = this.getAuthParams();
    params.set('id', trackId);
    return `${this.config.serverUrl}/rest/stream?${params.toString()}`;
  }

  getCoverArtUrl(coverArtId: string, size: number = 300): string {
    if (!coverArtId) {
      return 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60';
    }
    const params = this.getAuthParams();
    params.set('id', coverArtId);
    params.set('size', size.toString());
    return `${this.config.serverUrl}/rest/getCoverArt?${params.toString()}`;
  }

  async getAlbumList(type: 'newest' | 'recent' | 'frequent' | 'random' = 'newest', size: number = 20): Promise<Playlist[]> {
    interface SubsonicAlbumListResponse {
      albumList2?: {
        album?: Array<{
          id: string;
          title: string;
          artist: string;
          coverArt?: string;
          songCount?: number;
          duration?: number;
        }>;
      };
    }

    const res = await this.request<SubsonicAlbumListResponse>('getAlbumList2', {
      type,
      size: size.toString()
    });

    const albums = res.albumList2?.album || [];
    return albums.map((a) => ({
      id: `album-${a.id}`,
      title: a.title,
      description: `Álbum de ${a.artist}`,
      coverUrl: this.getCoverArtUrl(a.coverArt || a.id),
      tracks: [] // Will fetch on demand
    }));
  }

  async getPlaylists(): Promise<Playlist[]> {
    interface SubsonicPlaylistsResponse {
      playlists?: {
        playlist?: Array<{
          id: string;
          name: string;
          coverArt?: string;
          songCount?: number;
          duration?: number;
        }>;
      };
    }

    const res = await this.request<SubsonicPlaylistsResponse>('getPlaylists');
    const playlists = res.playlists?.playlist || [];

    return playlists.map((p) => ({
      id: `pl-${p.id}`,
      title: p.name,
      description: `${p.songCount || 0} canciones`,
      coverUrl: this.getCoverArtUrl(p.coverArt || p.id),
      tracks: []
    }));
  }

  async getPlaylistTracks(playlistId: string): Promise<Track[]> {
    const rawId = playlistId.replace(/^pl-/, '').replace(/^album-/, '');
    
    // Check if it's an album or playlist
    if (playlistId.startsWith('album-')) {
      interface SubsonicAlbumResponse {
        album?: {
          song?: Array<{
            id: string;
            title: string;
            artist: string;
            album: string;
            duration: number;
            coverArt?: string;
            genre?: string;
          }>;
        };
      }
      const res = await this.request<SubsonicAlbumResponse>('getAlbum', { id: rawId });
      const songs = res.album?.song || [];
      return songs.map((s) => ({
        id: s.id,
        title: s.title,
        artist: s.artist,
        album: s.album,
        duration: s.duration,
        coverUrl: this.getCoverArtUrl(s.coverArt || s.id),
        audioUrl: this.getStreamUrl(s.id),
        genre: s.genre
      }));
    }

    interface SubsonicPlaylistResponse {
      playlist?: {
        entry?: Array<{
          id: string;
          title: string;
          artist: string;
          album: string;
          duration: number;
          coverArt?: string;
          genre?: string;
        }>;
      };
    }

    const res = await this.request<SubsonicPlaylistResponse>('getPlaylist', { id: rawId });
    const songs = res.playlist?.entry || [];

    return songs.map((s) => ({
      id: s.id,
      title: s.title,
      artist: s.artist,
      album: s.album,
      duration: s.duration,
      coverUrl: this.getCoverArtUrl(s.coverArt || s.id),
      audioUrl: this.getStreamUrl(s.id),
      genre: s.genre
    }));
  }

  async search(query: string): Promise<Track[]> {
    interface SubsonicSearchResponse {
      searchResult3?: {
        song?: Array<{
          id: string;
          title: string;
          artist: string;
          album: string;
          duration: number;
          coverArt?: string;
          genre?: string;
        }>;
      };
    }

    const res = await this.request<SubsonicSearchResponse>('search3', {
      query,
      songCount: '30'
    });

    const songs = res.searchResult3?.song || [];
    return songs.map((s) => ({
      id: s.id,
      title: s.title,
      artist: s.artist,
      album: s.album,
      duration: s.duration,
      coverUrl: this.getCoverArtUrl(s.coverArt || s.id),
      audioUrl: this.getStreamUrl(s.id),
      genre: s.genre
    }));
  }

  async createPlaylist(name: string): Promise<Playlist> {
    interface SubsonicCreatePlaylistResponse {
      playlist?: {
        id: string;
        name: string;
        coverArt?: string;
        songCount?: number;
      };
    }

    const res = await this.request<SubsonicCreatePlaylistResponse>('createPlaylist', { name });
    const pl = res.playlist;
    const id = pl?.id || `custom-${Date.now()}`;
    return {
      id: `pl-${id}`,
      title: pl?.name || name,
      description: '0 canciones',
      coverUrl: this.getCoverArtUrl(pl?.coverArt || id),
      tracks: []
    };
  }

  async addTrackToPlaylist(playlistId: string, trackId: string): Promise<void> {
    const rawId = playlistId.replace(/^pl-/, '');
    await this.request('updatePlaylist', {
      playlistId: rawId,
      songIdToAdd: trackId
    });
  }

  async star(trackId: string): Promise<void> {
    await this.request('star', { id: trackId });
  }

  async unstar(trackId: string): Promise<void> {
    await this.request('unstar', { id: trackId });
  }

  async getStarredTracks(): Promise<Track[]> {
    interface SubsonicStarredResponse {
      starred2?: {
        song?: Array<{
          id: string;
          title: string;
          artist: string;
          album: string;
          duration: number;
          coverArt?: string;
          genre?: string;
        }>;
      };
    }

    const res = await this.request<SubsonicStarredResponse>('getStarred2');
    const songs = res.starred2?.song || [];
    return songs.map((s) => ({
      id: s.id,
      title: s.title,
      artist: s.artist,
      album: s.album,
      duration: s.duration,
      coverUrl: this.getCoverArtUrl(s.coverArt || s.id),
      audioUrl: this.getStreamUrl(s.id),
      genre: s.genre
    }));
  }
}
