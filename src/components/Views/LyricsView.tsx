import React, { useState, useEffect, useRef } from 'react';
import { Mic2, Music2, Volume2, Heart } from 'lucide-react';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { lyricsService, LyricsResult } from '../../services/lyrics/LyricsService';

export const LyricsView: React.FC = () => {
  const { currentTrack, currentTime, isPlaying, seek, likedTrackIds, toggleLike } = usePlayerStore();
  const [lyricsData, setLyricsData] = useState<LyricsResult | null>(null);
  const [loading, setLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  // Cargar letras cuando cambia la canción actual
  useEffect(() => {
    let isMounted = true;
    if (!currentTrack) {
      setLyricsData(null);
      return;
    }

    setLoading(true);
    lyricsService.getLyrics(currentTrack).then((res) => {
      if (isMounted) {
        setLyricsData(res);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [currentTrack?.id]);

  // Encontrar el índice de la línea que debe estar activa según el currentTime
  const activeIndex = React.useMemo(() => {
    if (!lyricsData || lyricsData.lines.length === 0) return -1;
    const lines = lyricsData.lines;

    for (let i = lines.length - 1; i >= 0; i--) {
      if (currentTime >= lines[i].time) {
        return i;
      }
    }
    return -1;
  }, [lyricsData, currentTime]);

  // Auto-scroll para centrar suavemente la línea activa
  useEffect(() => {
    if (activeIndex !== -1 && lineRefs.current[activeIndex]) {
      lineRefs.current[activeIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [activeIndex]);

  if (!currentTrack) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full p-8 text-center select-none text-[#727272]">
        <Music2 className="w-16 h-16 mb-4 opacity-40 animate-bounce" />
        <p className="text-lg font-bold text-white mb-1">No hay pista en reproducción</p>
        <p className="text-sm">Selecciona una canción para ver sus letras sincronizadas.</p>
      </div>
    );
  }

  const isLiked = likedTrackIds.has(currentTrack.id);

  return (
    <div className="relative flex-1 h-full w-full overflow-hidden select-none flex flex-col">
      {/* 1. Fondo de la Carátula del Álbum estilo Spotify (Visible, Amplia y con Desenfoque Suave) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img
          src={currentTrack.coverUrl}
          alt=""
          className="w-full h-full object-cover scale-110 filter blur-2xl opacity-60 transition-all duration-1000 transform"
        />
        {/* Viñeta cinematográfica para contraste y máxima legibilidad de las letras */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-black/85" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/85" />
      </div>

      {/* 2. Contenedor Principal en 2 Columnas (Estilo Spotify Desktop Lyrics) */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Columna Izquierda: Tarjeta Fija del Álbum con información */}
        <div className="hidden lg:flex flex-col justify-center items-center w-[380px] xl:w-[420px] p-8 shrink-0 border-r border-white/5 backdrop-blur-sm">
          <div className="flex flex-col items-start gap-5 w-full max-w-[320px]">
            {/* Foto del Álbum destacada */}
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/10 group">
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {isPlaying && (
                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-full flex items-center gap-1 border border-white/10 text-[#1db954]">
                  <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Sonando</span>
                </div>
              )}
            </div>

            {/* Metadata y Controles */}
            <div className="flex items-start justify-between w-full">
              <div className="overflow-hidden flex-1 pr-2">
                <h1 className="text-2xl font-black text-white truncate tracking-tight drop-shadow-md">
                  {currentTrack.title}
                </h1>
                <p className="text-base font-semibold text-[#1db954] truncate mt-0.5">
                  {currentTrack.artist}
                </p>
                {currentTrack.album && (
                  <p className="text-xs text-white/50 truncate mt-1">
                    {currentTrack.album}
                  </p>
                )}
              </div>

              <button
                onClick={() => toggleLike(currentTrack.id)}
                className="p-2 text-[#b3b3b3] hover:text-[#1db954] transition-colors cursor-pointer shrink-0"
                title={isLiked ? 'Quitar de favoritos' : 'Añadir a favoritos'}
              >
                <Heart
                  className={`w-6 h-6 transition-all ${
                    isLiked ? 'text-[#1db954] fill-[#1db954] scale-110' : 'hover:scale-110'
                  }`}
                />
              </button>
            </div>

            {/* Badge de sincronización */}
            <div className="w-full pt-2">
              {lyricsData?.isSynced ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-[#1db954]/20 text-[#1db954] border border-[#1db954]/30 shadow">
                  <Music2 className="w-3.5 h-3.5 animate-pulse" />
                  Karaoke sincronizado en tiempo real
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-white/10 text-[#b3b3b3] border border-white/10">
                  <Mic2 className="w-3.5 h-3.5" />
                  Letra de texto completo
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Letras Sincronizadas con Auto-Scroll y Click-to-Seek */}
        <div
          ref={containerRef}
          className="relative flex-1 overflow-y-auto px-6 md:px-12 lg:px-16 py-20 scroll-smooth space-y-7 flex flex-col items-start"
        >
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center w-full py-20 text-center">
              <Mic2 className="w-12 h-12 text-[#1db954] animate-pulse mb-3" />
              <p className="text-base font-bold text-white animate-pulse">
                Sincronizando letra con el audio oficial...
              </p>
            </div>
          ) : !lyricsData || lyricsData.lines.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center w-full py-20 text-center text-[#b3b3b3]">
              <Mic2 className="w-14 h-14 mb-3 opacity-40" />
              <p className="text-lg font-bold text-white mb-1">
                {lyricsData?.plainText || 'No se encontraron letras disponibles'}
              </p>
              <p className="text-xs text-[#727272]">
                Disfruta de la producción musical oficial en reproducción.
              </p>
            </div>
          ) : (
            lyricsData.lines.map((line, index) => {
              const isActive = index === activeIndex;
              const isPast = activeIndex !== -1 && index < activeIndex;

              return (
                <p
                  key={`${index}-${line.time}`}
                  ref={(el) => {
                    lineRefs.current[index] = el;
                  }}
                  onClick={() => seek(line.time)}
                  className={`cursor-pointer transition-all duration-300 font-extrabold tracking-tight text-left select-none leading-relaxed origin-left ${
                    isActive
                      ? 'text-white text-3xl md:text-5xl scale-105 filter drop-shadow-[0_0_25px_rgba(29,185,84,0.7)]'
                      : isPast
                      ? 'text-white/45 text-2xl md:text-3xl hover:text-white/80'
                      : 'text-white/25 text-2xl md:text-3xl hover:text-white/60'
                  }`}
                  title={`Saltar al segundo ${Math.floor(line.time)}s`}
                >
                  {line.text || '•••'}
                </p>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
