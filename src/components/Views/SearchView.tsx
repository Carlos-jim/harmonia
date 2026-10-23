import React, { useState, useEffect } from 'react';
import { Play, Pause, FolderPlus, Heart, Radio } from 'lucide-react';
import { GENRES } from '../../data/mockData';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useServerStore } from '../../stores/useServerStore';
import { useContextMenuStore } from '../../stores/useContextMenuStore';
import { Track } from '../../types';

interface SearchViewProps {
  searchQuery: string;
  onSearchChange?: (query: string) => void;
  onAddToPlaylist?: (track: Track) => void;
  onSelectArtist?: (artistName: string) => void;
}

/**
 * Dependency Inversion Principle (DIP):
 * SearchView solo interactúa con la abstracción IMusicProvider.
 * No sabe si los resultados vienen de Navidrome, Audius o el Mock.
 */
export const SearchView: React.FC<SearchViewProps> = ({
  searchQuery,
  onSearchChange,
  onAddToPlaylist,
  onSelectArtist
}) => {
  const { playSeedTrack, currentTrack, isPlaying, togglePlay, likedTrackIds, toggleLike } = usePlayerStore();
  const { provider, isConnected, activeMode } = useServerStore();
  const { openTrackMenu } = useContextMenuStore();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setTracks([]);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await provider.search(query);
        setTracks(results);
      } catch (err) {
        console.warn('Search error from provider:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, provider]);

  const handlePlay = (track: Track) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      // Arquitectura REA de Spotify: Las búsquedas NO son una lista de reproducción fija.
      // La pista seleccionada actúa como Pista Semilla (Seed Track).
      // Se reproduce inmediatamente (0ms) y genera la Radio / Autoplay dinámica con BaRT:
      // pistas del mismo artista y artistas del mismo género / red de colaboradores.
      playSeedTrack(track);
    }
  };

  return (
    <div className="p-6 flex flex-col gap-8 pb-16">
      {/* Resultados de búsqueda */}
      {searchQuery.trim() !== '' ? (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">
              Resultados para "{searchQuery}"
            </h2>
            {isSearching && (
              <span className="text-xs text-[#b3b3b3] animate-pulse">
                Buscando en {activeMode === 'youtube' ? 'YouTube Music (Oficial)' : activeMode === 'audius' ? 'Audius Online' : isConnected ? 'Navidrome' : 'catálogo'}...
              </span>
            )}
          </div>

          {!isSearching && tracks.length === 0 ? (
            <div className="text-[#b3b3b3] text-sm py-12 text-center">
              No se encontraron canciones ni artistas que coincidan con tu búsqueda.
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {tracks.map((track, index) => {
                const isCurrent = currentTrack?.id === track.id;
                return (
                  <div
                    key={track.id}
                    onClick={() => handlePlay(track)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      openTrackMenu(e.clientX, e.clientY, track);
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 group ${
                      isCurrent ? 'harmonia-table-row-active' : 'harmonia-table-row'
                    }`}
                  >
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className="w-4 flex items-center justify-center shrink-0">
                        {isCurrent && isPlaying ? (
                          <>
                            {/* Animated equalizer waves when not hovered */}
                            <div className="w-3.5 h-3.5 flex items-end justify-center gap-0.5 group-hover:hidden">
                              <span className="w-0.5 h-full bg-[#1db954] animate-pulse" />
                              <span className="w-0.5 h-2/3 bg-[#1db954] animate-pulse" />
                              <span className="w-0.5 h-4/5 bg-[#1db954] animate-pulse" />
                            </div>
                            {/* Pause icon on hover */}
                            <Pause className="w-4 h-4 text-white fill-white hidden group-hover:block" />
                          </>
                        ) : (
                          <>
                            <span className={`text-xs font-mono group-hover:hidden ${isCurrent ? 'text-[#1db954] font-bold' : 'text-[#727272]'}`}>
                              {index + 1}
                            </span>
                            <Play className="w-4 h-4 text-white fill-white hidden group-hover:block" />
                          </>
                        )}
                      </div>

                      <img
                        src={track.coverUrl}
                        alt={track.title}
                        className="w-11 h-11 rounded object-cover shrink-0"
                      />

                      <div className="overflow-hidden">
                        <p
                          className={`text-sm font-semibold truncate ${
                            isCurrent ? 'text-[#1db954]' : 'text-white'
                          }`}
                        >
                          {track.title}
                        </p>
                        <p
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectArtist?.(track.artist);
                          }}
                          className="text-xs text-[#b3b3b3] hover:text-white hover:underline cursor-pointer truncate"
                          title={`Ver perfil de ${track.artist}`}
                        >
                          {track.artist}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="hidden md:inline text-xs text-[#b3b3b3] truncate max-w-[180px]">
                        {track.album}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(track.id);
                        }}
                        className={`transition-colors ${
                          likedTrackIds.has(track.id)
                            ? 'text-[#1db954]'
                            : 'text-transparent group-hover:text-[#b3b3b3]'
                        }`}
                        title={likedTrackIds.has(track.id) ? 'Quitar de Me Gusta' : 'Guardar en Me Gusta'}
                      >
                        <Heart
                          className={`w-4 h-4 ${likedTrackIds.has(track.id) ? 'fill-[#1db954]' : 'hover:text-white'}`}
                        />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToPlaylist?.(track);
                        }}
                        className="text-transparent group-hover:text-[#b3b3b3] hover:text-white transition-colors cursor-pointer"
                        title="Añadir a playlist"
                      >
                        <FolderPlus className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playSeedTrack(track);
                        }}
                        className="text-transparent group-hover:text-[#b3b3b3] hover:text-white transition-colors cursor-pointer"
                        title="Iniciar Radio de esta canción"
                      >
                        <Radio className="w-4 h-4" />
                      </button>

                      <span className="text-xs text-[#b3b3b3] font-mono">
                        {Math.floor(track.duration / 60)}:
                        {(track.duration % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        /* Explorar todo (Categorías y Géneros) */
        <section>
          <h2 className="text-2xl font-bold text-white mb-5">Explorar todo</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {GENRES.map((genre) => (
              <div
                key={genre.id}
                onClick={() => onSearchChange?.(genre.name)}
                className={`relative h-44 rounded-lg p-4 overflow-hidden cursor-pointer bg-gradient-to-br ${genre.color} shadow-lg hover:scale-[1.02] transition-transform`}
              >
                <h3 className="font-extrabold text-xl text-white tracking-tight break-words">
                  {genre.name}
                </h3>
                <div className="absolute -bottom-2 -right-4 w-24 h-24 bg-black/20 rounded shadow-2xl rotate-[25deg] transform flex items-center justify-center pointer-events-none">
                  <span className="text-white/40 text-xs font-bold uppercase">{genre.name}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
