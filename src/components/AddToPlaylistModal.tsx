import React, { useState } from 'react';
import { X, Check, FolderPlus, Music } from 'lucide-react';
import { useServerStore } from '../stores/useServerStore';
import { Playlist, Track } from '../types';

interface AddToPlaylistModalProps {
  isOpen: boolean;
  track: Track | null;
  playlists: Playlist[];
  onClose: () => void;
  onAddedSuccess?: () => void;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  isOpen,
  track,
  playlists,
  onClose,
  onAddedSuccess
}) => {
  const { provider } = useServerStore();
  const [loadingPlaylistId, setLoadingPlaylistId] = useState<string | null>(null);
  const [successPlaylistId, setSuccessPlaylistId] = useState<string | null>(null);

  if (!isOpen || !track) return null;

  // Filter only user-created or server playlists (not albums)
  const targetPlaylists = playlists.filter((p) => !p.id.startsWith('album-'));

  const handleSelectPlaylist = async (playlist: Playlist) => {
    setLoadingPlaylistId(playlist.id);
    try {
      await provider.addTrackToPlaylist(playlist.id, track.id);
      setSuccessPlaylistId(playlist.id);
      onAddedSuccess?.();
      setTimeout(() => {
        setSuccessPlaylistId(null);
        onClose();
      }, 700);
    } catch (err) {
      console.warn('Error adding track to playlist:', err);
    } finally {
      setLoadingPlaylistId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="harmonia-modal-glass rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <FolderPlus className="w-5 h-5 text-[#1db954]" />
            <div>
              <h2 className="text-sm font-bold text-white">Añadir a playlist</h2>
              <p className="text-[11px] text-[#b3b3b3] truncate max-w-[200px]">
                {track.title} • {track.artist}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#b3b3b3] hover:text-white p-1 rounded-full hover:bg-[#282828] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Playlists List */}
        <div className="p-2 overflow-y-auto flex flex-col gap-1 flex-1">
          {targetPlaylists.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#727272]">
              No tienes playlists creadas todavía. Crea una desde la barra lateral.
            </div>
          ) : (
            targetPlaylists.map((playlist) => {
              const isLoading = loadingPlaylistId === playlist.id;
              const isSuccess = successPlaylistId === playlist.id;

              return (
                <button
                  key={playlist.id}
                  disabled={isLoading || isSuccess}
                  onClick={() => handleSelectPlaylist(playlist)}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#222222] transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded bg-[#2a2a2a] flex items-center justify-center shrink-0 overflow-hidden">
                      {playlist.coverUrl ? (
                        <img
                          src={playlist.coverUrl}
                          alt={playlist.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Music className="w-4 h-4 text-[#727272]" />
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-semibold text-white truncate group-hover:text-[#1db954] transition-colors">
                        {playlist.title}
                      </p>
                      <p className="text-[10px] text-[#727272] truncate">
                        {playlist.description}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 ml-2">
                    {isSuccess ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-[#1db954]">
                        <Check className="w-4 h-4" />
                        <span>Añadido</span>
                      </span>
                    ) : isLoading ? (
                      <span className="text-[11px] text-[#b3b3b3] animate-pulse">
                        Guardando...
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#727272] group-hover:text-white transition-colors">
                        Seleccionar
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
