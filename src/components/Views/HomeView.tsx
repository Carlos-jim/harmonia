import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Play,
  Pause,
  Radio,
  Disc3,
  BadgeCheck,
  Waves,
  Flame,
  PartyPopper,
  Headphones,
  Zap,
  Guitar,
  Compass
} from 'lucide-react';
import { SAMPLE_PLAYLISTS, SAMPLE_TRACKS } from '../../data/mockData';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useServerStore } from '../../stores/useServerStore';
import { useContextMenuStore } from '../../stores/useContextMenuStore';
import { Playlist, Track } from '../../types';
import { signalEngine } from '../../services/recommendation/SignalEngine';
import { recommendationEngine } from '../../services/recommendation/RecommendationEngine';
import { CoverFlowHero } from '../CoverFlowHero';

interface HomeViewProps {
  onSelectPlaylist: (playlistId: string) => void;
  onSelectArtist?: (artistName: string) => void;
}

interface MoodChip {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconColor?: string;
}

const MOOD_CHIPS: MoodChip[] = [
  { id: 'all', label: 'Todos', icon: Compass, iconColor: 'text-emerald-400' },
  { id: 'trap', label: 'Trap & Urbano', icon: Flame, iconColor: 'text-orange-400' },
  { id: 'reggaeton', label: 'Reggaetón', icon: PartyPopper, iconColor: 'text-amber-400' },
  { id: 'lofi', label: 'Lo-Fi & Chill', icon: Headphones, iconColor: 'text-cyan-400' },
  { id: 'pop', label: 'Pop & Hits', icon: Zap, iconColor: 'text-yellow-400' },
  { id: 'rock', label: 'Rock', icon: Guitar, iconColor: 'text-rose-400' },
  { id: 'fresh', label: 'Novedades', icon: Disc3, iconColor: 'text-emerald-400' }
];

export const HomeView: React.FC<HomeViewProps> = ({ onSelectPlaylist, onSelectArtist }) => {
  const { playTrack, currentTrack, isPlaying, togglePlay, startRadio } = usePlayerStore();
  const { provider, activeMode } = useServerStore();
  const { openTrackMenu } = useContextMenuStore();

  const [playlists, setPlaylists] = useState<Playlist[]>(SAMPLE_PLAYLISTS);
  const [trendingTracks, setTrendingTracks] = useState<Track[]>(SAMPLE_TRACKS);
  const [selectedMood, setSelectedMood] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [algorithmicMix, setAlgorithmicMix] = useState<Track[]>([]);
  const [topArtistName, setTopArtistName] = useState<string>('');
  const [isUpdatingMix, setIsUpdatingMix] = useState<boolean>(false);

  // Extrae el nombre principal del artista eliminando colaboraciones ('feat', 'ft', '&', ',')
  const getPrimaryArtist = useCallback((artistStr: string): string => {
    if (!artistStr) return '';
    const clean = artistStr.split(/[,&x\+]|\b(feat|ft)\b/i)[0].trim();
    return clean || artistStr.trim();
  }, []);

  const loadAlgorithmicMix = useCallback(async (forcedArtist?: string) => {
    try {
      setIsUpdatingMix(true);
      const topArtists = signalEngine.getTopArtists(1);
      const seedArtist =
        forcedArtist ||
        (currentTrack?.artist ? getPrimaryArtist(currentTrack.artist) : '') ||
        (topArtists.length > 0 ? topArtists[0].artist : 'Post Malone');

      setTopArtistName(seedArtist);

      const dummySeed: Track = {
        id: `seed-mix-${seedArtist.toLowerCase().replace(/\s+/g, '-')}`,
        title: 'Mix',
        artist: seedArtist,
        album: 'Mix',
        duration: 180,
        coverUrl: '',
        audioUrl: ''
      };

      const recs = await recommendationEngine.getRecommendedTracks(dummySeed, [], 6);
      if (recs.length > 0) {
        setAlgorithmicMix(recs);
      }
    } catch (err) {
      console.warn('Error fetching algorithmic mix:', err);
    } finally {
      setIsUpdatingMix(false);
    }
  }, [currentTrack, getPrimaryArtist]);

  // Actualización completamente automática al cambiar de pista o artista en el reproductor
  useEffect(() => {
    if (!currentTrack || !currentTrack.artist) return;

    const currentPrimary = getPrimaryArtist(currentTrack.artist);
    const displayedPrimary = getPrimaryArtist(topArtistName);

    // Si ya estamos mostrando el mix para este artista, no recargar
    if (displayedPrimary && displayedPrimary.toLowerCase() === currentPrimary.toLowerCase()) {
      return;
    }

    // Debounce suave de 800ms para evitar ráfagas al cambiar pistas rápidamente
    const timer = setTimeout(() => {
      loadAlgorithmicMix(currentPrimary);
    }, 800);

    return () => clearTimeout(timer);
  }, [currentTrack?.id, currentTrack?.artist, topArtistName, getPrimaryArtist, loadAlgorithmicMix]);

  // Suscripción reactiva en tiempo real al motor de señales de usuario (SignalEngine)
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const handleTasteUpdate = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const topArtists = signalEngine.getTopArtists(1);
        if (topArtists.length > 0) {
          const top = topArtists[0].artist;
          const topPrimary = getPrimaryArtist(top);
          const displayedPrimary = getPrimaryArtist(topArtistName);
          if (topPrimary && topPrimary.toLowerCase() !== displayedPrimary.toLowerCase()) {
            loadAlgorithmicMix(topPrimary);
          }
        }
      }, 500);
    };

    const unsubscribe = signalEngine.subscribe(handleTasteUpdate);
    window.addEventListener('harmonia:taste-updated', handleTasteUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener('harmonia:taste-updated', handleTasteUpdate);
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [topArtistName, getPrimaryArtist, loadAlgorithmicMix]);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (activeMode === 'demo') {
        setPlaylists(SAMPLE_PLAYLISTS);
        setTrendingTracks(SAMPLE_TRACKS);
        return;
      }

      setLoading(true);
      try {
        const [serverPlaylists, serverAlbums] = await Promise.all([
          provider.getPlaylists().catch(() => []),
          provider.getAlbums ? provider.getAlbums('newest', 12).catch(() => []) : Promise.resolve([])
        ]);

        if (!isMounted) return;

        const combined = [...serverPlaylists, ...serverAlbums];
        if (combined.length > 0) {
          setPlaylists(combined);
        }

        // Obtener pistas para la sección "Novedades en Streaming"
        if (serverAlbums.length > 0 && serverAlbums[0].tracks && serverAlbums[0].tracks.length > 0) {
          setTrendingTracks(serverAlbums[0].tracks);
        } else if (combined.length > 0) {
          const firstTracks = await provider.getPlaylistTracks(combined[0].id).catch(() => []);
          if (isMounted && firstTracks.length > 0) {
            setTrendingTracks(firstTracks.slice(0, 10));
          }
        }

        // Generar Mix Algorítmico personalizado según las señales del usuario
        await loadAlgorithmicMix();
      } catch (err) {
        console.warn('Error fetching home data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [provider, activeMode, loadAlgorithmicMix]);

  // Filtrado reactivo por Moods/Chips
  const displayedTracks = useMemo(() => {
    if (selectedMood === 'all') return trendingTracks;
    const filtered = trendingTracks.filter((track) => {
      const text = `${track.title} ${track.artist}`.toLowerCase();
      if (selectedMood === 'trap') {
        return text.includes('trap') || text.includes('block') || text.includes('courtz') || text.includes('eladio') || text.includes('anuel') || text.includes('666');
      }
      if (selectedMood === 'reggaeton') {
        return text.includes('bad bunny') || text.includes('feid') || text.includes('mora') || text.includes('rauw') || text.includes('reggaeton');
      }
      if (selectedMood === 'lofi') {
        return text.includes('lofi') || text.includes('chill') || text.includes('sleep') || text.includes('rain');
      }
      if (selectedMood === 'pop') {
        return text.includes('pop') || text.includes('weeknd') || text.includes('dua') || text.includes('taylor');
      }
      if (selectedMood === 'rock') {
        return text.includes('rock') || text.includes('metal') || text.includes('guitar');
      }
      return true;
    });

    return filtered.length > 0 ? filtered : trendingTracks;
  }, [selectedMood, trendingTracks]);

  const handlePlayTrack = (track: Track) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      playTrack(track, displayedTracks);
    }
  };

  const handlePlayPlaylist = async (playlist: Playlist, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playlist.tracks && playlist.tracks.length > 0) {
      playTrack(playlist.tracks[0], playlist.tracks);
    } else {
      try {
        const tracks = await provider.getPlaylistTracks(playlist.id);
        if (tracks.length > 0) {
          playTrack(tracks[0], tracks);
        }
      } catch (err) {
        console.warn('Error playing playlist:', err);
      }
    }
  };

  // Saludo dinámico según la hora del día
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 20) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <div className="p-6 flex flex-col gap-8 pb-20 select-none">
      {/* 1. Header con Saludo y Badges de Estudio */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">{getGreeting()}</h1>
            <span className="text-[10px] uppercase font-bold tracking-wider bg-white/10 text-white/90 border border-white/15 px-2.5 py-0.5 rounded-full backdrop-blur-md">
              Harmonia 3D
            </span>
          </div>
          <p className="text-xs text-[#b3b3b3] mt-1">
            Experiencia sonora inmersiva con cover flow, audio HQ y recomendaciones REA.
          </p>
        </div>

        {/* Quick Mood/Genre Filter Chips (Con iconos SVG profesionales) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          {MOOD_CHIPS.map((chip) => {
            const isActive = selectedMood === chip.id;
            const Icon = chip.icon;
            return (
              <button
                key={chip.id}
                onClick={() => setSelectedMood(chip.id)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap shrink-0 border ${
                  isActive
                    ? 'bg-[#1db954] text-black border-[#1db954] shadow-md scale-105'
                    : 'bg-white/5 hover:bg-white/10 text-[#b3b3b3] hover:text-white border-white/10 backdrop-blur-md'
                }`}
              >
                {Icon && (
                  <Icon
                    className={`w-3.5 h-3.5 transition-colors ${
                      isActive ? 'text-black fill-current' : chip.iconColor || 'text-white'
                    }`}
                  />
                )}
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Hero 3D Cover Flow Carousel (Inspirado en Imagen 1 - RhythmoTune) */}
      <section className="relative w-full rounded-2xl bg-gradient-to-b from-white/[0.05] to-transparent p-2 border border-white/5 shadow-2xl backdrop-blur-md overflow-hidden">
        <CoverFlowHero tracks={displayedTracks} onSelectArtist={onSelectArtist} />
      </section>

      {/* 3. Accesos Rápidos Glassmórficos Flotantes (Inspirado en Imagen 2 - Apple Music) */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {playlists.slice(0, 6).map((playlist) => (
            <div
              key={playlist.id}
              onClick={() => onSelectPlaylist(playlist.id)}
              className="relative group harmonia-card-bg bg-gradient-to-r from-white/[0.06] to-white/[0.02] hover:from-white/[0.12] hover:to-white/[0.06] backdrop-blur-2xl border border-white/10 hover:border-white/25 rounded-2xl p-2.5 flex items-center gap-3.5 transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.45)] hover:-translate-y-0.5 cursor-pointer overflow-hidden"
            >
              <img
                src={playlist.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60'}
                alt={playlist.title}
                className="w-14 h-14 rounded-xl object-cover shadow-[0_4px_14px_rgba(0,0,0,0.5)] border border-white/10 group-hover:scale-105 transition-transform duration-300 shrink-0"
              />
              <div className="overflow-hidden flex-1 min-w-0 pr-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#727272] group-hover:text-emerald-400 transition-colors truncate">
                  Playlist Oficial
                </p>
                <h4 className="font-extrabold text-sm text-white truncate tracking-tight mt-0.5">
                  {playlist.title}
                </h4>
              </div>
              <button
                onClick={(e) => handlePlayPlaylist(playlist, e)}
                className="w-10 h-10 rounded-full bg-[#1db954] text-black shadow-[0_0_20px_rgba(29,185,84,0.6)] flex items-center justify-center opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-200 mr-1 hover:scale-110 active:scale-95 shrink-0 cursor-pointer"
                title="Reproducir lista"
              >
                <Play className="w-5 h-5 fill-current ml-0.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Tendencias Oficiales / Playlists Destacadas en Tarjetas Póster (Inspirado en Imagen 1 - RhythmoTune) */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-white hover:underline cursor-pointer tracking-tight">
              {activeMode === 'youtube'
                ? 'Tendencias Oficiales'
                : activeMode === 'audius'
                ? 'En Tendencia Global'
                : 'Hecho para ti'}
            </h2>
          </div>
          {loading && (
            <span className="text-xs text-[#b3b3b3] animate-pulse">
              Actualizando catálogo...
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
          {playlists.slice(0, 12).map((playlist) => (
            <div
              key={playlist.id}
              onClick={() => onSelectPlaylist(playlist.id)}
              className="group relative p-3.5 harmonia-card-bg bg-white/[0.03] hover:bg-white/[0.08] backdrop-blur-2xl border border-white/10 hover:border-white/25 rounded-3xl transition-all duration-300 cursor-pointer flex flex-col gap-3 shadow-[0_8px_30px_rgba(0,0,0,0.35)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.55)] hover:-translate-y-1"
            >
              {/* Artwork Póster estilo RhythmoTune */}
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-[0_8px_25px_rgba(0,0,0,0.6)] border border-white/10">
                <img
                  src={playlist.coverUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60'}
                  alt={playlist.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                
                {/* Badge Esmerilado Superior */}
                <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/15 flex items-center gap-1 text-[10px] font-bold text-white shadow">
                  <BadgeCheck className="w-2.5 h-2.5 text-[#1db954]" />
                  <span>Oficial</span>
                </div>

                {/* Botón Flotante Neón de Reproducción */}
                <button
                  onClick={(e) => handlePlayPlaylist(playlist, e)}
                  className="absolute bottom-3 right-3 w-12 h-12 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black shadow-[0_0_25px_rgba(29,185,84,0.7)] flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </button>
              </div>

              <div>
                <h3 className="font-extrabold text-sm text-white truncate tracking-tight group-hover:text-[#1db954] transition-colors">
                  {playlist.title}
                </h3>
                <p className="text-xs text-[#727272] group-hover:text-[#b3b3b3] line-clamp-2 mt-1 leading-relaxed transition-colors">
                  {playlist.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Sección Mix Algorítmico Harmonia (BaRT Engine Marquee) */}
      {algorithmicMix.length > 0 && (
        <section className="bg-gradient-to-r from-emerald-950/30 via-slate-900/40 to-black/25 backdrop-blur-2xl p-6 rounded-3xl border border-emerald-500/25 shadow-[0_15px_40px_rgba(16,185,129,0.12)] relative overflow-hidden">
          {/* Línea de luz superior de cristal */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#1db954]" />
                <h2
                  onClick={() => topArtistName && onSelectArtist?.(topArtistName)}
                  className="text-xl font-extrabold text-white tracking-tight hover:underline cursor-pointer"
                  title={topArtistName ? `Ver perfil de ${topArtistName}` : undefined}
                >
                  Mix Algorítmico: {topArtistName ? `Especial ${topArtistName}` : 'Hecho para ti'}
                </h2>
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-[#1db954]/20 text-[#1db954] px-2.5 py-1 rounded-full border border-[#1db954]/30 backdrop-blur-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1db954] animate-ping" />
                  BaRT Engine
                </span>
              </div>
              <p className="text-xs text-[#b3b3b3]">
                Generado automáticamente con base en afinidad implícita, transiciones y balance BaRT (80% afinidad / 20% descubrimiento).
              </p>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
              {isUpdatingMix && (
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full backdrop-blur-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Actualizando...
                </span>
              )}

              <button
                onClick={() => playTrack(algorithmicMix[0], algorithmicMix)}
                className="flex items-center gap-2 text-xs font-bold text-black bg-gradient-to-r from-[#1db954] to-emerald-400 hover:from-[#1ed760] hover:to-emerald-300 px-4 py-2 rounded-full transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-[0_0_20px_rgba(29,185,84,0.4)] shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                <span>Reproducir Mix</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {algorithmicMix.map((track) => (
              <div
                key={`algo-${track.id}`}
                onClick={() => playTrack(track, algorithmicMix)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  openTrackMenu(e.clientX, e.clientY, track);
                }}
                className="p-3 bg-white/[0.03] hover:bg-white/[0.08] backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl transition-all duration-300 group cursor-pointer flex flex-col gap-2.5 shadow-lg hover:-translate-y-1"
              >
                <div className="relative aspect-square w-full rounded-xl overflow-hidden shadow-md border border-white/10">
                  <img
                    src={track.coverUrl}
                    alt={track.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-white truncate group-hover:text-[#1db954] transition-colors">
                    {track.title}
                  </p>
                  <p
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectArtist?.(track.artist);
                    }}
                    className="text-[11px] text-[#b3b3b3] hover:text-white hover:underline truncate mt-0.5 cursor-pointer"
                    title={`Ver perfil de ${track.artist}`}
                  >
                    {track.artist}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. Pistas recomendadas con Visualizador Waveform interactivo */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Waves className="w-5 h-5 text-[#1db954]" />
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {activeMode === 'youtube'
                ? 'Lanzamientos de Estudio Oficiales'
                : activeMode === 'audius'
                ? 'Top Éxitos en Streaming'
                : 'Novedades en Streaming'}
            </h2>
          </div>
          <span className="text-xs text-[#727272]">
            {displayedTracks.length} canciones
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {displayedTracks.slice(0, 12).map((track) => {
            const isCurrent = currentTrack?.id === track.id;
            return (
              <div
                key={track.id}
                onClick={() => handlePlayTrack(track)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  openTrackMenu(e.clientX, e.clientY, track);
                }}
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 group border ${
                  isCurrent
                    ? 'bg-white/10 border-[#1db954]/50 shadow-md backdrop-blur-md'
                    : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/5 backdrop-blur-sm'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden shadow">
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {isCurrent && isPlaying ? (
                        <Pause className="w-5 h-5 text-white fill-white" />
                      ) : (
                        <Play className="w-5 h-5 text-white fill-white" />
                      )}
                    </div>
                  </div>

                  <div className="overflow-hidden">
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-sm font-semibold truncate ${
                          isCurrent ? 'text-[#1db954]' : 'text-white'
                        }`}
                      >
                        {track.title}
                      </p>
                      {/* Audio Waveform Equalizer en la pista activa (Inspirado en Imagen 3) */}
                      {isCurrent && isPlaying && (
                        <div className="flex items-end gap-0.5 h-3 shrink-0">
                          <span className="w-0.5 bg-[#1db954] rounded-full animate-wave-1 h-3" />
                          <span className="w-0.5 bg-[#1db954] rounded-full animate-wave-2 h-2" />
                          <span className="w-0.5 bg-[#1db954] rounded-full animate-wave-3 h-3.5" />
                        </div>
                      )}
                    </div>
                    <p
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectArtist?.(track.artist);
                      }}
                      className="text-xs text-[#b3b3b3] hover:text-white hover:underline truncate mt-0.5 cursor-pointer"
                      title={`Ver perfil de ${track.artist}`}
                    >
                      {track.artist}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startRadio(track);
                    }}
                    className="p-1.5 rounded-full hover:bg-white/10 text-[#727272] hover:text-[#1db954] opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    title="Iniciar Radio (Mix de 15 pistas similares)"
                  >
                    <Radio className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-[#b3b3b3] font-mono px-2">
                    {Math.floor(track.duration / 60)}:
                    {(track.duration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
