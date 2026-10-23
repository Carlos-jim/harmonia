import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Heart,
  X,
  Maximize2,
  ExternalLink,
  Volume2
} from 'lucide-react';
import { usePlayerStore } from '../stores/usePlayerStore';
import { formatTime } from '../utils/formatTime';

interface MiniPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  onExpand?: () => void;
}

/**
 * Componente Mini-Player Flotante (Picture-in-Picture):
 * Ofrece una ventana compacta tipo widget y soporte para la API nativa
 * de Document Picture-in-Picture (Chromium / WebView2 Always-on-top).
 */
export const MiniPlayer: React.FC<MiniPlayerProps> = ({ isOpen, onClose, onExpand }) => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    likedTrackIds,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    toggleLike
  } = usePlayerStore();

  const [isNativePipActive, setIsNativePipActive] = useState(false);

  // Intentar abrir ventana nativa flotante Always-on-Top si el navegador lo soporta
  const requestNativePip = async () => {
    try {
      const pip = (window as unknown as { documentPictureInPicture?: { requestWindow: (opts: { width: number; height: number }) => Promise<Window> } }).documentPictureInPicture;
      if (pip) {
        const pipWindow = await pip.requestWindow({
          width: 360,
          height: 220
        });

        // Copiar estilos CSS a la nueva ventana PiP
        document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
          pipWindow.document.head.appendChild(node.cloneNode(true));
        });

        setIsNativePipActive(true);

        pipWindow.addEventListener('pagehide', () => {
          setIsNativePipActive(false);
        });
      }
    } catch (err) {
      console.warn('Native Document PiP not available or dismissed:', err);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setIsNativePipActive(false);
    }
  }, [isOpen]);

  if (!isOpen || !currentTrack) return null;

  const isLiked = likedTrackIds.has(currentTrack.id);

  return (
    <div className="fixed bottom-24 right-6 z-50 w-84 bg-[#141414]/95 border border-white/10 backdrop-blur-2xl shadow-2xl rounded-2xl p-4 select-none animate-in zoom-in-95 duration-200 flex flex-col gap-3 group">
      {/* Top Header con controles de ventana */}
      <div className="flex items-center justify-between text-xs text-[#b3b3b3]">
        <div className="flex items-center gap-1.5 font-bold tracking-wider uppercase text-[10px] text-[#1db954]">
          <Volume2 className="w-3.5 h-3.5 animate-pulse" />
          <span>Mini Reproductor</span>
          {isNativePipActive && (
            <span className="text-[9px] bg-[#1db954]/20 text-[#1db954] px-1.5 py-0.5 rounded-full font-medium lowercase">
              pip activo
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Botón para lanzar en ventana nativa Always-on-top */}
          <button
            onClick={requestNativePip}
            className={`p-1 rounded transition-colors ${
              isNativePipActive
                ? 'text-[#1db954] bg-[#1db954]/20'
                : 'hover:text-white hover:bg-white/10'
            }`}
            title={
              isNativePipActive
                ? 'Ventana Always-on-top abierta'
                : 'Abrir en ventana flotante independiente (Always-on-top)'
            }
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          {onExpand && (
            <button
              onClick={onExpand}
              className="p-1 hover:text-white hover:bg-white/10 rounded transition-colors"
              title="Volver a la vista principal"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:text-white hover:bg-white/10 rounded transition-colors"
            title="Cerrar mini reproductor"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Info Principal: Carátula + Info */}
      <div className="flex items-center gap-3">
        <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-lg">
          <img
            src={currentTrack.coverUrl}
            alt={currentTrack.title}
            className="w-full h-full object-cover"
          />
          {isPlaying && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-0.5">
              <span className="w-1 bg-[#1db954] h-3 animate-pulse rounded-full" />
              <span className="w-1 bg-[#1db954] h-5 animate-pulse rounded-full delay-100" />
              <span className="w-1 bg-[#1db954] h-2 animate-pulse rounded-full delay-200" />
            </div>
          )}
        </div>

        <div className="overflow-hidden flex-1">
          <p className="text-sm font-bold text-white truncate hover:underline cursor-pointer">
            {currentTrack.title}
          </p>
          <p className="text-xs text-[#b3b3b3] truncate">{currentTrack.artist}</p>
        </div>

        <button
          onClick={() => toggleLike(currentTrack.id)}
          className="p-1.5 text-[#b3b3b3] hover:text-white transition-colors"
          title={isLiked ? 'Quitar Me Gusta' : 'Guardar Me Gusta'}
        >
          <Heart
            className={`w-4 h-4 transition-transform active:scale-125 ${
              isLiked ? 'text-[#1db954] fill-[#1db954]' : ''
            }`}
          />
        </button>
      </div>

      {/* Timeline Slider */}
      <div className="flex flex-col gap-1">
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={(e) => seek(Number(e.target.value))}
          className="w-full h-1 bg-[#333] rounded-lg appearance-none cursor-pointer accent-[#1db954] hover:accent-[#1ed760]"
        />
        <div className="flex justify-between text-[10px] text-[#727272] font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Botones de Reproducción */}
      <div className="flex items-center justify-center gap-4 pt-1">
        <button
          onClick={prevTrack}
          className="p-2 text-[#b3b3b3] hover:text-white transition-colors"
          title="Anterior"
        >
          <SkipBack className="w-4 h-4 fill-current" />
        </button>

        <button
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-white hover:bg-[#1ed760] text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
          title={isPlaying ? 'Pausa' : 'Reproducir'}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current ml-0.5" />
          )}
        </button>

        <button
          onClick={nextTrack}
          className="p-2 text-[#b3b3b3] hover:text-white transition-colors"
          title="Siguiente"
        >
          <SkipForward className="w-4 h-4 fill-current" />
        </button>
      </div>
    </div>
  );
};
