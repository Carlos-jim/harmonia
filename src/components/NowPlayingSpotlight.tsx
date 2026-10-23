import React, { useState, useEffect } from 'react';
import {
  X,
  Heart,
  Radio,
  Mic2,
  Play,
  Pause,
  ExternalLink,
  Disc3,
  Plus,
  BadgeCheck
} from 'lucide-react';
import { usePlayerStore } from '../stores/usePlayerStore';
import { useContextMenuStore } from '../stores/useContextMenuStore';
import { lyricsService, LyricsResult } from '../services/lyrics/LyricsService';
import { Track } from '../types';

interface NowPlayingSpotlightProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToLyrics: () => void;
  onAddToPlaylist?: (track: Track) => void;
  onNavigateToArtist?: (artistName: string) => void;
}

/**
 * NowPlayingSpotlight:
 * Columna 3 persistente/colapsable (Inspirada en Image 2 - Concepto Apple Music/Harmonia Glass).
 * Exhibe la carátula en alta resolución con glow ambiental, detalles del track,
 * previsualización en vivo de la letra sincronizada, etiquetas de mood y la cola próxima.
 */
export const NowPlayingSpotlight: React.FC<NowPlayingSpotlightProps> = ({
  isOpen,
  onClose,
  onNavigateToLyrics,
  onAddToPlaylist,
  onNavigateToArtist
}) => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    togglePlay,
    likedTrackIds,
    toggleLike,
    startRadio,
    queue,
    queueIndex,
    playTrack
  } = usePlayerStore();

  const { openTrackMenu } = useContextMenuStore();

  const [lyricsData, setLyricsData] = useState<LyricsResult | null>(null);

  // Obtener letra en tiempo real para el snippet sincronizado
  useEffect(() => {
    let isMounted = true;
    if (!currentTrack) {
      setLyricsData(null);
      return;
    }

    lyricsService.getLyrics(currentTrack).then((res) => {
      if (isMounted) {
        setLyricsData(res);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [currentTrack?.id]);

  // Encontrar la línea activa de la letra según currentTime
  const currentLyricLine = React.useMemo(() => {
    if (!lyricsData || lyricsData.lines.length === 0) return null;
    const lines = lyricsData.lines;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (currentTime >= lines[i].time) {
        return lines[i].text;
      }
    }
    return lines[0]?.text || null;
  }, [lyricsData, currentTime]);

  if (!isOpen) return null;

  const isLiked = currentTrack ? likedTrackIds.has(currentTrack.id) : false;

  // Próximas canciones en cola
  const upcomingQueue = queue.slice(queueIndex + 1, queueIndex + 4);

  // Generación de etiquetas dinámicas de estilo / género
  const getTags = (track: Track): string[] => {
    const text = `${track.title} ${track.artist}`.toLowerCase();
    const tags: string[] = ['Estudio Oficial'];
    if (text.includes('trap') || text.includes('block') || text.includes('eladio') || text.includes('anuel') || text.includes('courtz')) {
      tags.push('Trap Latino', 'Urbano');
    } else if (text.includes('reggaeton') || text.includes('bad bunny') || text.includes('feid') || text.includes('mora')) {
      tags.push('Reggaetón', 'Flow 2026');
    } else if (text.includes('lofi') || text.includes('chill') || text.includes('sleep') || text.includes('rain')) {
      tags.push('Lo-Fi & Chill', 'Atmósfera');
    } else if (text.includes('rock') || text.includes('metal')) {
      tags.push('Rock Alternativo');
    } else {
      tags.push('Tendencia Global', 'Alta Fidelidad');
    }
    return tags;
  };

  return (
    <aside className="w-80 xl:w-88 h-full harmonia-spotlight flex flex-col shrink-0 select-none overflow-hidden z-20 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <Disc3 className="w-5 h-5 text-[#1db954] animate-spin" style={{ animationDuration: '6s' }} />
          <h2 className="font-bold text-sm text-white tracking-wide uppercase">En Reproducción</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-full text-[#b3b3b3] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Ocultar panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Contenido scrolleable */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-6">
        {currentTrack ? (
          <>
            {/* Carátula de Álbum con Glow ambiental */}
            <div className="relative group w-full aspect-square rounded-2xl overflow-hidden shadow-[0_15px_35px_rgba(0,0,0,0.6)] border border-white/10 shrink-0">
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Botón flotante Play/Pause superpuesto al hover */}
              <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={togglePlay}
                  className="w-14 h-14 rounded-full bg-white text-black hover:bg-[#1db954] hover:text-black flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95 cursor-pointer"
                  title={isPlaying ? 'Pausar' : 'Reproducir'}
                >
                  {isPlaying ? (
                    <Pause className="w-7 h-7 fill-current" />
                  ) : (
                    <Play className="w-7 h-7 fill-current ml-0.5" />
                  )}
                </button>
              </div>

              {/* Indicador de audio HQ en vivo */}
              {isPlaying && (
                <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-2 border border-white/10">
                  <div className="flex items-end gap-0.5 h-3">
                    <span className="w-0.5 bg-[#1db954] rounded-full animate-wave-1 h-3" />
                    <span className="w-0.5 bg-[#1db954] rounded-full animate-wave-2 h-2" />
                    <span className="w-0.5 bg-[#1db954] rounded-full animate-wave-3 h-3.5" />
                    <span className="w-0.5 bg-[#1db954] rounded-full animate-wave-2 h-1.5" />
                  </div>
                  <span className="text-[10px] font-bold text-[#1db954] uppercase tracking-wider">
                    En Vivo
                  </span>
                </div>
              )}
            </div>

            {/* Metadatos de la Canción */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-extrabold text-lg text-white truncate tracking-tight hover:underline cursor-pointer">
                  {currentTrack.title}
                </h3>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleLike(currentTrack.id)}
                    className="p-1.5 rounded-full hover:bg-white/10 text-[#b3b3b3] hover:text-white transition-colors cursor-pointer"
                    title={isLiked ? 'Quitar de Favoritos' : 'Añadir a Favoritos'}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'text-[#1db954] fill-[#1db954]' : ''}`} />
                  </button>
                  {onAddToPlaylist && (
                    <button
                      onClick={() => onAddToPlaylist(currentTrack)}
                      className="p-1.5 rounded-full hover:bg-white/10 text-[#b3b3b3] hover:text-white transition-colors cursor-pointer"
                      title="Añadir a playlist"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => startRadio(currentTrack)}
                    className="p-1.5 rounded-full hover:bg-white/10 text-[#b3b3b3] hover:text-[#1db954] transition-colors cursor-pointer"
                    title="Radio de pista (Mix inteligente)"
                  >
                    <Radio className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p
                onClick={() => onNavigateToArtist && onNavigateToArtist(currentTrack.artist)}
                className="text-sm text-[#b3b3b3] hover:text-white hover:underline transition-colors cursor-pointer font-medium truncate"
                title={`Ver perfil de ${currentTrack.artist}`}
              >
                {currentTrack.artist}
              </p>
              <p className="text-xs text-[#727272] truncate">
                {currentTrack.album || 'Single'}
              </p>
            </div>

            {/* Badges de Género & Estado */}
            <div className="flex flex-wrap gap-1.5">
              {getTags(currentTrack).map((tag, i) => (
                <span
                  key={i}
                  className="text-[11px] font-medium bg-white/5 hover:bg-white/10 border border-white/5 text-[#b3b3b3] hover:text-white px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Snippet de Letra Sincronizada en Tiempo Real */}
            <div
              onClick={onNavigateToLyrics}
              className="group p-4 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-[#1db954]/50 transition-all cursor-pointer flex flex-col gap-2 relative overflow-hidden shadow-lg"
            >
              <div className="flex items-center justify-between text-xs text-[#b3b3b3]">
                <div className="flex items-center gap-1.5 font-semibold text-white">
                  <Mic2 className="w-3.5 h-3.5 text-[#1db954]" />
                  <span>Letra en vivo</span>
                </div>
                <span className="text-[10px] text-[#1db954] font-medium group-hover:underline flex items-center gap-0.5">
                  Expandir <ExternalLink className="w-2.5 h-2.5" />
                </span>
              </div>

              <p className="text-sm font-semibold text-white/90 line-clamp-2 leading-relaxed transition-all">
                {currentLyricLine ? (
                  `"${currentLyricLine}"`
                ) : (
                  <span className="text-[#727272] italic text-xs font-normal">
                    {lyricsData && lyricsData.lines.length === 0
                      ? 'No hay letras disponibles para este tema'
                      : 'Cargando letras sincronizadas...'}
                  </span>
                )}
              </p>
            </div>

            {/* A continuación / Próximas Pistas de la Cola */}
            <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#b3b3b3] uppercase tracking-wider">
                  A continuación
                </span>
                <span className="text-[11px] text-[#727272]">
                  {Math.max(0, queue.length - queueIndex - 1)} restantes
                </span>
              </div>

              {upcomingQueue.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {upcomingQueue.map((track, idx) => (
                    <div
                      key={`${track.id}-${idx}`}
                      onClick={() => playTrack(track, queue)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        openTrackMenu(e.clientX, e.clientY, track);
                      }}
                      className="group flex items-center justify-between p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.08] transition-colors cursor-pointer border border-transparent hover:border-white/5"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <img
                          src={track.coverUrl}
                          alt={track.title}
                          className="w-10 h-10 rounded-md object-cover shrink-0"
                        />
                        <div className="overflow-hidden">
                          <p className="text-xs font-semibold text-white truncate group-hover:text-[#1db954] transition-colors">
                            {track.title}
                          </p>
                          <p className="text-[11px] text-[#727272] truncate">{track.artist}</p>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5">
                        <button className="opacity-0 group-hover:opacity-100 p-1 text-[#b3b3b3] hover:text-white transition-opacity">
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                        <span className="text-[11px] font-mono text-[#727272]">
                          {Math.floor(track.duration / 60)}:
                          {(track.duration % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#727272] py-2">
                  No hay más pistas en la cola. El algoritmo REA generará recomendaciones automáticas al finalizar.
                </p>
              )}
            </div>

            {/* Acerca del Artista (Tarjeta Estilo Spotify Desktop) */}
            <div
              onClick={() => onNavigateToArtist && onNavigateToArtist(currentTrack.artist)}
              className="group relative rounded-2xl overflow-hidden bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 p-4 transition-all duration-300 cursor-pointer flex flex-col gap-3 shadow-lg hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#b3b3b3]">
                  Acerca del artista
                </span>
                <span className="text-[11px] font-semibold text-[#1db954] group-hover:underline">
                  Ver perfil
                </span>
              </div>

              <div className="flex items-center gap-3">
                <img
                  src={currentTrack.coverUrl}
                  alt={currentTrack.artist}
                  className="w-12 h-12 rounded-full object-cover shadow-md border border-white/10"
                />
                <div className="overflow-hidden flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-extrabold text-white truncate group-hover:text-[#1db954] transition-colors">
                      {currentTrack.artist}
                    </p>
                    <BadgeCheck className="w-3.5 h-3.5 text-sky-400 fill-current shrink-0" />
                  </div>
                  <p className="text-xs text-[#727272] truncate mt-0.5">Artista Verificado</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-16 text-[#727272] gap-3">
            <Disc3 className="w-12 h-12 opacity-30 animate-spin" style={{ animationDuration: '10s' }} />
            <p className="text-sm font-semibold text-white">Nada sonando ahora</p>
            <p className="text-xs max-w-[200px]">
              Selecciona cualquier álbum, recomendación o mix para ver detalles aquí.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};
