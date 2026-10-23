import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  ListPlus,
  User,
  Radio,
  FolderPlus,
  Heart,
  Mic2,
  Copy,
  Check
} from 'lucide-react';
import { useContextMenuStore } from '../stores/useContextMenuStore';
import { usePlayerStore } from '../stores/usePlayerStore';
import { Track } from '../types';

interface TrackContextMenuProps {
  onNavigateToArtist: (artistName: string) => void;
  onNavigateToLyrics: (track: Track) => void;
  onAddToPlaylist: (track: Track) => void;
}

export const TrackContextMenu: React.FC<TrackContextMenuProps> = ({
  onNavigateToArtist,
  onNavigateToLyrics,
  onAddToPlaylist
}) => {
  const { isOpen, x, y, track, closeMenu } = useContextMenuStore();
  const { playTrack, addToQueue, startRadio, likedTrackIds, toggleLike } = usePlayerStore();

  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPos, setAdjustedPos] = useState({ x: 0, y: 0 });
  const [copied, setCopied] = useState(false);

  // Asegurar que el menú contextual permanezca dentro de los límites visibles de la ventana
  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
      return;
    }

    const menuWidth = 240;
    const menuHeight = 360;
    const padding = 12;

    let posX = x;
    let posY = y;

    if (posX + menuWidth > window.innerWidth - padding) {
      posX = window.innerWidth - menuWidth - padding;
    }
    if (posY + menuHeight > window.innerHeight - padding) {
      posY = window.innerHeight - menuHeight - padding;
    }

    setAdjustedPos({
      x: Math.max(padding, posX),
      y: Math.max(padding, posY)
    });
  }, [x, y, isOpen]);

  // Cerrar al hacer clic fuera, scroll o presionar Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMenu();
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', closeMenu, true);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', closeMenu, true);
    };
  }, [isOpen, closeMenu]);

  if (!isOpen || !track) return null;

  const isLiked = likedTrackIds.has(track.id);

  const handlePlayNow = () => {
    playTrack(track);
    closeMenu();
  };

  const handleAddToQueue = () => {
    addToQueue(track);
    closeMenu();
  };

  const handleGoToArtist = () => {
    onNavigateToArtist(track.artist);
    closeMenu();
  };

  const handleStartRadio = () => {
    startRadio(track);
    closeMenu();
  };

  const handleAddToPlaylistAction = () => {
    onAddToPlaylist(track);
    closeMenu();
  };

  const handleToggleLike = () => {
    toggleLike(track.id);
  };

  const handleViewLyrics = () => {
    onNavigateToLyrics(track);
    closeMenu();
  };

  const handleCopyLinkOrText = async () => {
    try {
      await navigator.clipboard.writeText(`${track.title} - ${track.artist}`);
      setCopied(true);
      setTimeout(() => {
        closeMenu();
      }, 700);
    } catch (err) {
      console.warn('Error copying to clipboard:', err);
      closeMenu();
    }
  };

  return (
    <div
      ref={menuRef}
      style={{
        top: `${adjustedPos.y}px`,
        left: `${adjustedPos.x}px`
      }}
      className="fixed z-50 w-60 rounded-2xl bg-[#181818]/95 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] py-1.5 px-1 select-none animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Cabecera contextual con información del track */}
      <div className="flex items-center gap-2.5 px-3 py-2 border-b border-white/10 mb-1">
        <img
          src={track.coverUrl}
          alt={track.title}
          className="w-8 h-8 rounded-lg object-cover shadow border border-white/10 shrink-0"
        />
        <div className="overflow-hidden min-w-0">
          <p className="text-xs font-bold text-white truncate">{track.title}</p>
          <p className="text-[11px] text-[#b3b3b3] truncate">{track.artist}</p>
        </div>
      </div>

      {/* Acciones principales */}
      <div className="flex flex-col gap-0.5">
        <button
          onClick={handlePlayNow}
          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer text-left w-full"
        >
          <Play className="w-4 h-4 text-[#1db954] fill-[#1db954]" />
          <span>Reproducir ahora</span>
        </button>

        <button
          onClick={handleAddToQueue}
          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer text-left w-full"
        >
          <ListPlus className="w-4 h-4 text-emerald-400" />
          <span>Añadir a la cola</span>
        </button>

        <button
          onClick={handleGoToArtist}
          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer text-left w-full"
        >
          <User className="w-4 h-4 text-sky-400" />
          <span>Ir al artista</span>
        </button>

        <button
          onClick={handleStartRadio}
          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer text-left w-full"
        >
          <Radio className="w-4 h-4 text-amber-400" />
          <span>Iniciar radio de la canción</span>
        </button>

        <button
          onClick={handleAddToPlaylistAction}
          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer text-left w-full"
        >
          <FolderPlus className="w-4 h-4 text-purple-400" />
          <span>Añadir a lista de reproducción...</span>
        </button>

        <div className="h-[1px] bg-white/10 my-1 mx-2" />

        <button
          onClick={handleToggleLike}
          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer text-left w-full"
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'text-[#1db954] fill-[#1db954]' : 'text-white/70'}`} />
          <span>{isLiked ? 'Quitar de tus Me Gusta' : 'Guardar en tus Me Gusta'}</span>
        </button>

        <button
          onClick={handleViewLyrics}
          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer text-left w-full"
        >
          <Mic2 className="w-4 h-4 text-rose-400" />
          <span>Ver letras sincronizadas</span>
        </button>

        <button
          onClick={handleCopyLinkOrText}
          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer text-left w-full"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-[#1db954]" />
              <span className="text-[#1db954]">Copiado al portapapeles</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-white/70" />
              <span>Copiar título y artista</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
