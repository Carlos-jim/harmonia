import { Playlist, Track } from '../types';

export const SAMPLE_TRACKS: Track[] = [
  {
    id: 'track-1',
    title: 'Midnight City Neon',
    artist: 'Cyber Synth Orchestra',
    album: 'Retro Wave Odyssey',
    duration: 372,
    coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    genre: 'Synthwave'
  },
  {
    id: 'track-2',
    title: 'Lo-Fi Chill Sunset',
    artist: 'Aura Beats',
    album: 'Study Session vol. 1',
    duration: 423,
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=60',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    genre: 'Lo-Fi'
  },
  {
    id: 'track-3',
    title: 'Electric Dreams',
    artist: 'Starlight Groove',
    album: 'Neon Skyline',
    duration: 345,
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=60',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    genre: 'Electronic'
  },
  {
    id: 'track-4',
    title: 'Acoustic Morning Breeze',
    artist: 'Luna Rivera',
    album: 'Sunlight Reflections',
    duration: 302,
    coverUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=500&auto=format&fit=crop&q=60',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    genre: 'Acoustic'
  },
  {
    id: 'track-5',
    title: 'Deep House Horizons',
    artist: 'Vektor Pulse',
    album: 'Ibiza Nights',
    duration: 350,
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    genre: 'House'
  },
  {
    id: 'track-6',
    title: 'Cybernetic Heartbeat',
    artist: 'Nova Protocol',
    album: 'Terminal Zero',
    duration: 280,
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    genre: 'Cyberpunk'
  }
];

export const SAMPLE_PLAYLISTS: Playlist[] = [
  {
    id: 'pl-1',
    title: 'Descubrimiento Semanal',
    description: 'Tu mezcla semanal de música fresca creada para ti.',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60',
    tracks: [SAMPLE_TRACKS[0], SAMPLE_TRACKS[1], SAMPLE_TRACKS[2]]
  },
  {
    id: 'pl-2',
    title: 'Éxitos España & Global',
    description: 'Los temas más escuchados ahora mismo en el mundo.',
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60',
    tracks: [SAMPLE_TRACKS[2], SAMPLE_TRACKS[3], SAMPLE_TRACKS[4], SAMPLE_TRACKS[5]]
  },
  {
    id: 'pl-3',
    title: 'Focus & Chill',
    description: 'Pistas instrumentales y Lo-Fi para concentrarte y programar.',
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=60',
    tracks: [SAMPLE_TRACKS[1], SAMPLE_TRACKS[3]]
  }
];

export const GENRES = [
  { id: 'g-1', name: 'Pop', color: 'from-pink-600 to-rose-700' },
  { id: 'g-2', name: 'Hip-Hop / Trap', color: 'from-amber-600 to-orange-700' },
  { id: 'g-3', name: 'Electrónica / Dance', color: 'from-emerald-600 to-teal-800' },
  { id: 'g-4', name: 'Rock & Alternativo', color: 'from-red-600 to-zinc-900' },
  { id: 'g-5', name: 'Lo-Fi & Chill', color: 'from-indigo-600 to-purple-800' },
  { id: 'g-6', name: 'Podcasts', color: 'from-cyan-600 to-blue-800' }
];
