import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  BadgeCheck,
  Radio,
  Heart,
  FolderPlus,
  Disc3,
  Users,
  Check,
  UserPlus
} from 'lucide-react';
import { Track } from '../../types';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useServerStore } from '../../stores/useServerStore';
import { useContextMenuStore } from '../../stores/useContextMenuStore';
import { formatTime } from '../../utils/formatTime';
import { recommendationEngine } from '../../services/recommendation/RecommendationEngine';

interface ArtistViewProps {
  artistName: string;
  onSelectArtist: (artistName: string) => void;
  onAddToPlaylist?: (track: Track) => void;
}

interface AlbumRelease {
  id: string;
  title: string;
  year: string;
  coverUrl: string;
  tracks: Track[];
}

interface RelatedArtist {
  name: string;
  coverUrl: string;
  genre: string;
}

const FOLLOWED_ARTISTS_KEY = 'harmonia_followed_artists_v1';

export const ArtistView: React.FC<ArtistViewProps> = ({
  artistName,
  onSelectArtist,
  onAddToPlaylist
}) => {
  const { currentTrack, isPlaying, playTrack, togglePlay, likedTrackIds, toggleLike, startRadio } =
    usePlayerStore();
  const { provider } = useServerStore();
  const { openTrackMenu } = useContextMenuStore();

  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<AlbumRelease[]>([]);
  const [relatedArtists, setRelatedArtists] = useState<RelatedArtist[]>([]);
  const [heroImage, setHeroImage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [showAllTracks, setShowAllTracks] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'popular' | 'discography' | 'about'>('popular');

  // Cargar estado de seguimiento del artista desde localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(FOLLOWED_ARTISTS_KEY);
      if (raw) {
        const followed = JSON.parse(raw);
        setIsFollowing(Boolean(followed[artistName.toLowerCase()]));
      }
    } catch (e) {
      console.warn('Error reading followed artists:', e);
    }
  }, [artistName]);

  const toggleFollow = () => {
    setIsFollowing((prev) => {
      const next = !prev;
      try {
        const raw = localStorage.getItem(FOLLOWED_ARTISTS_KEY);
        const followed = raw ? JSON.parse(raw) : {};
        if (next) {
          followed[artistName.toLowerCase()] = true;
        } else {
          delete followed[artistName.toLowerCase()];
        }
        localStorage.setItem(FOLLOWED_ARTISTS_KEY, JSON.stringify(followed));
      } catch (e) {
        console.warn('Error saving followed artist:', e);
      }
      return next;
    });
  };

  // Cargar información del artista: Top canciones, discografía y artistas relacionados
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setShowAllTracks(false);

    async function loadArtistData() {
      try {
        // 1. Obtener canciones populares del artista vía YouTube Search / Provider
        const searchTracks = await provider.search(artistName).catch(() => []);

        if (!isMounted) return;

        // Filtrar y ordenar pistas del artista
        const cleanName = artistName.toLowerCase().trim();
        const artistTracks = searchTracks.filter((t) =>
          t.artist.toLowerCase().includes(cleanName) || t.title.toLowerCase().includes(cleanName)
        );

        const primaryTracks = artistTracks.length > 0 ? artistTracks : searchTracks;
        setTopTracks(primaryTracks);

        if (primaryTracks.length > 0 && primaryTracks[0].coverUrl) {
          setHeroImage(primaryTracks[0].coverUrl);
        }

        // 2. Construir agrupaciones de discografía (Álbumes / Sencillos)
        const albumMap: Record<string, Track[]> = {};
        for (const track of primaryTracks) {
          const albumKey = track.album || `${track.title} (Single)`;
          if (!albumMap[albumKey]) {
            albumMap[albumKey] = [];
          }
          albumMap[albumKey].push(track);
        }

        const releases: AlbumRelease[] = Object.entries(albumMap).map(([title, trks], idx) => ({
          id: `album-${idx}-${title.toLowerCase().replace(/\s+/g, '-')}`,
          title,
          year: '2024',
          coverUrl: trks[0]?.coverUrl || heroImage,
          tracks: trks
        }));
        setAlbums(releases);

        // 3. Obtener artistas relacionados a través del motor BaRT / RecommendationEngine
        const dummySeed: Track = {
          id: `seed-artist-${artistName.toLowerCase().replace(/\s+/g, '-')}`,
          title: 'Hits',
          artist: artistName,
          album: 'Hits',
          duration: 180,
          coverUrl: heroImage,
          audioUrl: ''
        };

        const recs = await recommendationEngine.getRecommendedTracks(dummySeed, [], 10).catch(() => []);
        if (isMounted) {
          // Extraer artistas únicos diferentes al actual
          const uniqueArtists = new Map<string, RelatedArtist>();
          for (const t of recs) {
            const tArtist = t.artist.trim();
            if (
              tArtist &&
              tArtist.toLowerCase() !== cleanName &&
              !uniqueArtists.has(tArtist.toLowerCase())
            ) {
              uniqueArtists.set(tArtist.toLowerCase(), {
                name: tArtist,
                coverUrl: t.coverUrl,
                genre: t.genre || 'Urbano / Contemporáneo'
              });
            }
          }
          setRelatedArtists(Array.from(uniqueArtists.values()).slice(0, 6));
        }
      } catch (err) {
        console.warn('Error loading artist view:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadArtistData();

    return () => {
      isMounted = false;
    };
  }, [artistName, provider]);

  const isCurrentArtistPlaying =
    isPlaying && topTracks.some((t) => t.id === currentTrack?.id);

  const handlePlayArtist = () => {
    if (topTracks.length === 0) return;
    if (isCurrentArtistPlaying) {
      togglePlay();
    } else {
      playTrack(topTracks[0], topTracks);
    }
  };

  const displayedTracks = showAllTracks ? topTracks.slice(0, 10) : topTracks.slice(0, 5);

  return (
    <div className="flex flex-col pb-24 select-none">
      {/* 1. Hero Header con Portada Panorámica e Identidad de Artista */}
      <div className="relative w-full h-80 sm:h-96 overflow-hidden flex flex-col justify-end p-6 sm:p-8">
        {/* Fondo con imagen del artista y superposición degradada */}
        <div className="absolute inset-0 z-0">
          {heroImage ? (
            <img
              src={heroImage}
              alt={artistName}
              className="w-full h-full object-cover object-center filter blur-md scale-105 opacity-50 transition-all duration-700"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-emerald-900/60 via-slate-950 to-black" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        </div>

        {/* Información del Artista */}
        <div className="relative z-10 flex flex-col gap-2 max-w-4xl">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white/90 uppercase tracking-widest">
            <BadgeCheck className="w-4 h-4 text-sky-400 fill-current" />
            <span>Artista verificado</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-none drop-shadow-xl">
            {artistName}
          </h1>

          <p className="text-sm text-[#b3b3b3] mt-2 font-medium">
            Oyentes activos en Harmonia Desktop basados en afinidad BaRT y streaming continuo
          </p>
        </div>
      </div>

      {/* 2. Barra de Acciones del Artista */}
      <div className="px-6 sm:px-8 py-5 flex items-center gap-4 bg-gradient-to-b from-[#121212] to-transparent">
        {/* Botón Principal de Reproducción */}
        <button
          onClick={handlePlayArtist}
          disabled={topTracks.length === 0}
          title={isCurrentArtistPlaying ? 'Pausar' : `Reproducir canciones de ${artistName}`}
          className="w-14 h-14 rounded-full bg-[#1db954] hover:bg-[#1ed760] hover:scale-105 active:scale-95 text-black flex items-center justify-center shadow-[0_8px_25px_rgba(29,185,84,0.4)] transition-all cursor-pointer disabled:opacity-50"
        >
          {isCurrentArtistPlaying ? (
            <Pause className="w-6 h-6 fill-current" />
          ) : (
            <Play className="w-6 h-6 fill-current ml-1" />
          )}
        </button>

        {/* Botón de Seguir */}
        <button
          onClick={toggleFollow}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border backdrop-blur-md ${
            isFollowing
              ? 'bg-white/10 text-[#1db954] border-[#1db954]/50 hover:bg-white/15'
              : 'bg-white/5 text-white border-white/20 hover:border-white hover:scale-105'
          }`}
        >
          {isFollowing ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Siguiendo</span>
            </>
          ) : (
            <>
              <UserPlus className="w-3.5 h-3.5" />
              <span>Seguir</span>
            </>
          )}
        </button>

        {/* Botón de Iniciar Radio de Artista */}
        {topTracks.length > 0 && (
          <button
            onClick={() => startRadio(topTracks[0])}
            title={`Iniciar radio personalizada de ${artistName}`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold text-white/80 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 transition-all cursor-pointer backdrop-blur-md"
          >
            <Radio className="w-3.5 h-3.5 text-[#1db954]" />
            <span className="hidden sm:inline">Radio del artista</span>
          </button>
        )}
      </div>

      {/* 3. Navegación por Pestañas del Artista */}
      <div className="px-6 sm:px-8 border-b border-white/10 flex items-center gap-8 mb-6">
        <button
          onClick={() => setActiveTab('popular')}
          className={`pb-3 text-sm font-bold tracking-tight transition-colors cursor-pointer relative ${
            activeTab === 'popular' ? 'text-white' : 'text-[#b3b3b3] hover:text-white'
          }`}
        >
          Popular
          {activeTab === 'popular' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1db954] rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('discography')}
          className={`pb-3 text-sm font-bold tracking-tight transition-colors cursor-pointer relative ${
            activeTab === 'discography' ? 'text-white' : 'text-[#b3b3b3] hover:text-white'
          }`}
        >
          Discografía
          {activeTab === 'discography' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1db954] rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('about')}
          className={`pb-3 text-sm font-bold tracking-tight transition-colors cursor-pointer relative ${
            activeTab === 'about' ? 'text-white' : 'text-[#b3b3b3] hover:text-white'
          }`}
        >
          Acerca de
          {activeTab === 'about' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1db954] rounded-full" />
          )}
        </button>
      </div>

      {/* 4. Contenido según pestaña activa */}
      <div className="px-6 sm:px-8 flex flex-col gap-10">
        {activeTab === 'popular' && (
          <>
            {/* Sección: Canciones Populares */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4 tracking-tight">Populares</h2>

              {loading ? (
                <div className="flex flex-col gap-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={`skeleton-${i}`}
                      className="h-14 bg-white/5 rounded-xl animate-pulse"
                    />
                  ))}
                </div>
              ) : displayedTracks.length > 0 ? (
                <div className="flex flex-col">
                  {displayedTracks.map((track, idx) => {
                    const isTrackPlaying = isPlaying && currentTrack?.id === track.id;
                    const isLiked = likedTrackIds.has(track.id);

                    return (
                      <div
                        key={`top-${track.id}-${idx}`}
                        onClick={() => playTrack(track, topTracks)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          openTrackMenu(e.clientX, e.clientY, track);
                        }}
                        className={`group flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer hover:bg-white/10 ${
                          isTrackPlaying ? 'bg-white/10 text-[#1db954]' : 'text-white'
                        }`}
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          {/* Número o Icono de Reproducción */}
                          <div className="w-6 text-center text-sm font-mono text-[#b3b3b3] group-hover:hidden">
                            {isTrackPlaying ? (
                              <span className="text-[#1db954] font-bold">▶</span>
                            ) : (
                              idx + 1
                            )}
                          </div>
                          <div className="w-6 hidden group-hover:flex items-center justify-center text-white">
                            {isTrackPlaying ? (
                              <Pause className="w-4 h-4 fill-current text-[#1db954]" />
                            ) : (
                              <Play className="w-4 h-4 fill-current" />
                            )}
                          </div>

                          {/* Carátula */}
                          <img
                            src={track.coverUrl}
                            alt={track.title}
                            className="w-10 h-10 rounded-lg object-cover shadow"
                          />

                          {/* Título y Álbum */}
                          <div className="flex flex-col truncate pr-4">
                            <span
                              className={`text-sm font-semibold truncate ${
                                isTrackPlaying ? 'text-[#1db954]' : 'text-white'
                              }`}
                            >
                              {track.title}
                            </span>
                            <span className="text-xs text-[#b3b3b3] truncate">
                              {track.album || artistName}
                            </span>
                          </div>
                        </div>

                        {/* Acciones: Like, Añadir a Playlist, Duración */}
                        <div className="flex items-center gap-4 text-[#b3b3b3]">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLike(track.id);
                            }}
                            className={`p-1.5 rounded-full hover:scale-110 transition-all ${
                              isLiked ? 'text-[#1db954]' : 'opacity-0 group-hover:opacity-100 hover:text-white'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                          </button>

                          {onAddToPlaylist && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddToPlaylist(track);
                              }}
                              title="Añadir a lista de reproducción"
                              className="p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:text-white transition-all"
                            >
                              <FolderPlus className="w-4 h-4" />
                            </button>
                          )}

                          <span className="text-xs font-mono w-12 text-right">
                            {formatTime(track.duration)}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Botón Ver Más / Ver Menos */}
                  {topTracks.length > 5 && (
                    <button
                      onClick={() => setShowAllTracks(!showAllTracks)}
                      className="self-start mt-3 text-xs font-bold text-[#b3b3b3] hover:text-white uppercase tracking-wider transition-colors cursor-pointer py-1.5 px-3 rounded-lg hover:bg-white/5"
                    >
                      {showAllTracks ? 'Ver menos' : 'Ver más'}
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-[#b3b3b3]">No se encontraron pistas populares.</p>
              )}
            </section>

            {/* Sección: Artistas Similares / A los fans también les gusta */}
            {relatedArtists.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-[#1db954]" />
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    A los fans también les gusta
                  </h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {relatedArtists.map((related) => (
                    <div
                      key={`rel-${related.name}`}
                      onClick={() => onSelectArtist(related.name)}
                      className="group p-3.5 bg-white/[0.03] hover:bg-white/[0.08] backdrop-blur-xl border border-white/5 hover:border-white/15 rounded-2xl transition-all duration-300 cursor-pointer flex flex-col items-center text-center gap-3 hover:-translate-y-1 shadow-lg"
                    >
                      <div className="relative aspect-square w-full rounded-full overflow-hidden shadow-md border border-white/10">
                        <img
                          src={related.coverUrl}
                          alt={related.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-[#1db954] text-black flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          </div>
                        </div>
                      </div>

                      <div className="w-full overflow-hidden">
                        <p className="text-xs font-bold text-white truncate group-hover:text-[#1db954] transition-colors">
                          {related.name}
                        </p>
                        <p className="text-[11px] text-[#b3b3b3] truncate mt-0.5">Artista</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {activeTab === 'discography' && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <Disc3 className="w-5 h-5 text-[#1db954]" />
              <h2 className="text-xl font-bold text-white tracking-tight">Discografía de estudio</h2>
            </div>

            {albums.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {albums.map((album) => (
                  <div
                    key={album.id}
                    onClick={() => playTrack(album.tracks[0], album.tracks)}
                    className="group p-3 bg-white/[0.03] hover:bg-white/[0.08] backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl transition-all duration-300 cursor-pointer flex flex-col gap-2.5 shadow-lg hover:-translate-y-1"
                  >
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden shadow-md border border-white/10">
                      <img
                        src={album.coverUrl}
                        alt={album.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-10 h-10 rounded-full bg-[#1db954] text-black flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </div>
                      </div>
                    </div>

                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-white truncate group-hover:text-[#1db954] transition-colors">
                        {album.title}
                      </p>
                      <p className="text-[11px] text-[#b3b3b3] truncate mt-0.5">
                        {album.year} • {album.tracks.length} {album.tracks.length === 1 ? 'canción' : 'canciones'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#b3b3b3]">No se encontraron lanzamientos disponibles.</p>
            )}
          </section>
        )}

        {activeTab === 'about' && (
          <section className="bg-gradient-to-br from-white/[0.05] to-transparent p-6 sm:p-8 rounded-3xl border border-white/10 backdrop-blur-xl max-w-3xl">
            <div className="flex items-center gap-2 mb-3">
              <BadgeCheck className="w-5 h-5 text-sky-400 fill-current" />
              <h2 className="text-xl font-bold text-white tracking-tight">Acerca de {artistName}</h2>
            </div>

            <p className="text-sm text-[#b3b3b3] leading-relaxed mb-6">
              Artista indexado en Harmonia Desktop Music Engine. Sus reproducciones generan señales en
              el motor de recomendaciones BaRT, calculando transiciones continuas en el grafo de Markov
              y afinidad implícita sin interrupciones.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10">
              <div>
                <p className="text-xs text-[#b3b3b3]">Canciones catalogadas</p>
                <p className="text-lg font-bold text-white mt-0.5">{topTracks.length}</p>
              </div>
              <div>
                <p className="text-xs text-[#b3b3b3]">Lanzamientos</p>
                <p className="text-lg font-bold text-white mt-0.5">{albums.length}</p>
              </div>
              <div>
                <p className="text-xs text-[#b3b3b3]">Estado de seguimiento</p>
                <p className="text-lg font-bold text-[#1db954] mt-0.5">
                  {isFollowing ? 'Siguiendo' : 'No seguido'}
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
