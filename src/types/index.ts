export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  coverUrl: string;
  audioUrl: string;
  genre?: string;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  tracks: Track[];
}

export type ViewType = 'home' | 'search' | 'playlist' | 'liked' | 'lyrics' | 'artist';

export * from './recommendation';
