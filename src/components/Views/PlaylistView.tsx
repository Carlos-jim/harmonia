import React, { useState, useEffect } from 'react';
import { Play, Pause, Clock, Heart, FolderPlus } from 'lucide-react';
import { SAMPLE_PLAYLISTS, SAMPLE_TRACKS } from '../../data/mockData';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useServerStore } from '../../stores/useServerStore';
import { useContextMenuStore } from '../../stores/useContextMenuStore';
import { formatTime } from '../../utils/formatTime';
import { Track, Playlist } from '../../types';

interface PlaylistViewProps {
  playlistId: string | null;
  isLikedView?: boolean;
  onAddToPlaylist?: (track: Track) => void;
  onSelectArtist?: (artistName: string) => void;
}

/**
 * Dependency Inversion (DIP) & Liskov Substitution (LSP):
 * PlaylistView se apoya en el contrato IMusicProvider inyectado.
 */
export const PlaylistView: React.FC<PlaylistViewProps> = ({
  playlistId,
  isLikedView = false,
  onAddToPlaylist,
  onSelectArtist
}) => {
  const {
    currentTrack,
    isPlaying,
    likedTrackIds,
    playTrack,
    togglePlay,
    toggleLike
  } = usePlayerStore();
  const { openTrackMenu } = useContextMenuStore();

  const { provider, isConnected } = useServerStore();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (isLikedView) return;

      if (playlistId) {
        setIsLoading(true);
        try {
          const playlistTracks = await provider.getPlaylistTracks(playlistId);
          if (isMounted) {
            setTracks(playlistTracks);
            setCurrentPlaylist({
              id: playlistId,
              title: playlistTracks.length > 0 && playlistTracks[0].album ? playlistTracks[0].album : 'Colección',
              description: `Lista de reproducción (${playlistTracks.length} canciones)`,
              coverUrl: playlistTracks.length > 0 ? playlistTracks[0].coverUrl : '',
              tracks: playlistTracks
            });
          }
        } catch (err) {
          console.warn('Error loading playlist tracks from provider:', err);
        } finally {
          if (isMounted) setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [playlistId, isLikedView, provider]);

  const defaultMock = SAMPLE_PLAYLISTS.find((p) => p.id === playlistId) || SAMPLE_PLAYLISTS[0];

  const playlist: Playlist = isLikedView
    ? {
        id: 'liked',
        title: 'Canciones que te gustan',
        description: 'Todas las pistas que has marcado con el corazón.',
        coverUrl: '',
        tracks: tracks.length > 0
          ? tracks.filter((t) => likedTrackIds.has(t.id))
          : SAMPLE_TRACKS.filter((t) => likedTrackIds.has(t.id))
      }
    : (currentPlaylist || defaultMock);

  const displayedTracks = isLikedView
    ? playlist.tracks
    : (tracks.length > 0 ? tracks : playlist.tracks);

  const totalDuration = displayedTracks.reduce((acc, t) => acc + (t.duration || 0), 0);

  const isPlaylistPlaying =
    isPlaying && displayedTracks.some((t) => t.id === currentTrack?.id);

  const handleMainPlay = () => {
    if (displayedTracks.length === 0) return;
    if (isPlaylistPlaying) {
      togglePlay();
    } else {
      playTrack(displayedTracks[0], displayedTracks);
    }
  };

  const handleRowPlay = (track: Track) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      playTrack(track, displayedTracks);
    }
  };

  return (
    <div className="flex flex-col pb-20">
      {/* Header del Álbum / Playlist */}
      <div className="p-8 bg-gradient-to-b from-indigo-900/40 via-transparent to-transparent flex flex-col sm:flex-row items-center sm:items-end gap-6">
        {isLikedView ? (
          <div className="w-52 h-52 rounded bg-gradient-to-br from-indigo-700 to-emerald-400 flex items-center justify-center shadow-2xl shrink-0">
            <Heart className="w-24 h-24 text-white fill-white" />
          </div>
        ) : (
          <img
            src={playlist.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60'}
            alt={playlist.title}
            className="w-52 h-52 object-cover rounded shadow-2xl shrink-0"
          />
        )}

        <div className="flex flex-col gap-2 overflow-hidden text-center sm:text-left">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            {playlistId?.startsWith('album-') ? 'Álbum' : 'Playlist'}
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight break-words">
            {playlist.title}
          </h1>
          <p className="text-sm text-[#b3b3b3] mt-2">{playlist.description}</p>
          <div className="text-xs text-white/80 font-medium flex items-center justify-center sm:justify-start gap-2 mt-1">
            <span className="font-bold text-white">{isConnected ? 'Servidor Navidrome' : 'Harmonia Music'}</span>
            <span>•</span>
            <span>{displayedTracks.length} canciones</span>
            <span>•</span>
            <span>{formatTime(totalDuration)}</span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-8 py-5 flex items-center gap-6 bg-transparent">
        <button
          onClick={handleMainPlay}
          disabled={displayedTracks.length === 0}
          className="w-14 h-14 rounded-full bg-[#1db954] hover:bg-[#1ed760] disabled:bg-[#1db954]/40 hover:scale-105 active:scale-95 text-black shadow-xl flex items-center justify-center transition-all cursor-pointer"
        >
          {isPlaylistPlaying ? (
            <Pause className="w-7 h-7 fill-current" />
          ) : (
            <Play className="w-7 h-7 fill-current ml-1" />
          )}
        </button>

        {displayedTracks[0] && (
          <button
            onClick={() => toggleLike(displayedTracks[0].id)}
            className="text-[#b3b3b3] hover:text-white transition-colors"
          >
            <Heart className="w-8 h-8" />
          </button>
        )}
      </div>

      {/* Tabla de Canciones */}
      <div className="px-8 bg-transparent">
        <div className="grid grid-cols-[16px_1fr_1fr_40px] gap-4 px-4 py-2 border-b border-white/10 text-xs font-bold text-[#b3b3b3] uppercase tracking-wider">
          <span>#</span>
          <span>Título</span>
          <span className="hidden md:inline">Álbum</span>
          <div className="flex justify-end">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-[#b3b3b3] animate-pulse">
            Cargando canciones desde el proveedor...
          </div>
        ) : (
          <div className="flex flex-col gap-1 mt-2">
            {displayedTracks.map((track, index) => {
              const isCurrent = currentTrack?.id === track.id;
              const isLiked = likedTrackIds.has(track.id);

              return (
                <div
                  key={track.id}
                  onClick={() => handleRowPlay(track)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    openTrackMenu(e.clientX, e.clientY, track);
                  }}
                  className={`grid grid-cols-[16px_1fr_1fr_40px] gap-4 items-center px-4 py-2.5 rounded-xl cursor-pointer group transition-all duration-200 ${
                    isCurrent ? 'harmonia-table-row-active' : 'harmonia-table-row'
                  }`}
                >
                  {/* Index / Play icon on hover */}
                  <div className="flex items-center text-xs font-mono text-[#b3b3b3]">
                    {isCurrent && isPlaying ? (
                      <>
                        <div className="w-3.5 h-3.5 flex items-end gap-0.5 group-hover:hidden">
                          <span className="w-1 h-full bg-[#1db954] animate-pulse" />
                          <span className="w-1 h-2/3 bg-[#1db954] animate-pulse" />
                          <span className="w-1 h-4/5 bg-[#1db954] animate-pulse" />
                        </div>
                        <Pause className="w-3.5 h-3.5 text-white fill-white hidden group-hover:block" />
                      </>
                    ) : (
                      <>
                        <span className={`group-hover:hidden ${isCurrent ? 'text-[#1db954] font-bold' : ''}`}>{index + 1}</span>
                        <Play className="w-3.5 h-3.5 text-white fill-white hidden group-hover:block" />
                      </>
                    )}
                  </div>

                  {/* Track Details */}
                  <div className="flex items-center gap-3 overflow-hidden">
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className="w-10 h-10 rounded object-cover shrink-0"
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

                  {/* Album */}
                  <span className="hidden md:inline text-xs text-[#b3b3b3] truncate">
                    {track.album}
                  </span>

                  {/* Duration, Like & Add to Playlist */}
                  <div className="flex items-center justify-end gap-3 text-xs text-[#b3b3b3] font-mono">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(track.id);
                      }}
                      className={`transition-colors ${
                        isLiked ? 'text-[#1db954]' : 'text-transparent group-hover:text-[#b3b3b3]'
                      }`}
                      title={isLiked ? 'Quitar de Me Gusta' : 'Guardar en Me Gusta'}
                    >
                      <Heart
                        className={`w-4 h-4 ${isLiked ? 'fill-[#1db954]' : 'hover:text-white'}`}
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

                    <span>{formatTime(track.duration)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
