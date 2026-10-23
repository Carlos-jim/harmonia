import React, { useState } from 'react';
import { X, Plus, Music } from 'lucide-react';
import { useServerStore } from '../stores/useServerStore';
import { Playlist } from '../types';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaylistCreated: (newPlaylist: Playlist) => void;
}

export const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  isOpen,
  onClose,
  onPlaylistCreated
}) => {
  const { provider } = useServerStore();
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const newPlaylist = await provider.createPlaylist(name.trim());
      onPlaylistCreated(newPlaylist);
      setName('');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear la playlist';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="harmonia-modal-glass rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#282828] flex items-center justify-center text-[#1db954]">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Crear Playlist</h2>
              <p className="text-xs text-[#b3b3b3]">Guarda tu música personalizada</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#b3b3b3] hover:text-white p-1 rounded-full hover:bg-[#282828] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-[#b3b3b3] uppercase tracking-wider block mb-1.5">
              Nombre de la lista
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mi lista favorita #1"
              className="w-full bg-[#121212] border border-[#333] focus:border-[#1db954] text-white text-sm rounded-md px-3.5 py-2.5 outline-none transition-colors"
              autoFocus
              required
            />
          </div>

          {error && (
            <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded border border-rose-500/20">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-[#b3b3b3] hover:text-white transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="bg-[#1db954] hover:bg-[#1ed760] disabled:bg-[#1db954]/50 text-black font-bold text-xs px-5 py-2.5 rounded-full transition-transform active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Creando...' : 'Crear'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
