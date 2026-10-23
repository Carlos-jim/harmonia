import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, Flame } from 'lucide-react';
import { Track } from '../types';
import { usePlayerStore } from '../stores/usePlayerStore';

interface CoverFlowHeroProps {
  tracks: Track[];
  onSelectArtist?: (artistName: string) => void;
}

/**
 * CoverFlowHero:
 * Carrusel interactivo 3D Cover Flow inspirado en la Imagen 1 (RhythmoTune).
 * Renderiza álbumes en perspectiva tridimensional (rotateY, translateZ, scale)
 * con controles táctiles, clic para centrar y reproducción instantánea.
 */
export const CoverFlowHero: React.FC<CoverFlowHeroProps> = ({ tracks, onSelectArtist }) => {
  const [activeIndex, setActiveIndex] = useState(2);
  const { currentTrack, isPlaying, togglePlay, playSeedTrack } = usePlayerStore();

  if (!tracks || tracks.length === 0) return null;

  const displayTracks = tracks.slice(0, 7);

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : displayTracks.length - 1));
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev < displayTracks.length - 1 ? prev + 1 : 0));
  };

  const handlePlayCurrent = (track: Track, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      playSeedTrack(track);
    }
  };

  return (
    <div className="relative w-full py-4 select-none flex flex-col items-center overflow-hidden">
      {/* 3D Perspective Container */}
      <div
        className="relative w-full h-[310px] sm:h-[350px] flex items-center justify-center"
        style={{ perspective: '1100px', transformStyle: 'preserve-3d' }}
      >
        {displayTracks.map((track, idx) => {
          const offset = idx - activeIndex;
          const isCenter = offset === 0;
          const isFar = Math.abs(offset) > 2;

          if (isFar) return null;

          // Cálculo de posición en perspectiva 3D
          let translateX = offset * 180;
          let translateZ = -Math.abs(offset) * 110;
          let rotateY = offset * -28;
          let scale = isCenter ? 1.08 : 0.85;
          let opacity = isCenter ? 1 : 0.65;
          let zIndex = 30 - Math.abs(offset) * 5;

          const isCurrentActivePlaying = isCenter && currentTrack?.id === track.id && isPlaying;

          return (
            <div
              key={track.id}
              onClick={() => {
                if (isCenter) {
                  handlePlayCurrent(track);
                } else {
                  setActiveIndex(idx);
                }
              }}
              style={{
                transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                zIndex,
                opacity
              }}
              className={`absolute top-4 w-60 sm:w-72 h-68 sm:h-80 rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 ease-out shadow-2xl group border ${
                isCenter
                  ? 'border-white/20 ring-2 ring-white/10 shadow-[0_15px_45px_rgba(0,0,0,0.8)]'
                  : 'border-white/5 hover:opacity-90'
              }`}
            >
              {/* Portada a pantalla completa */}
              <img
                src={track.coverUrl}
                alt={track.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Degradado inferior con información */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-transparent flex flex-col justify-end p-4 sm:p-5">
                {isCenter && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="flex items-center gap-1 bg-[#1db954]/20 border border-[#1db954]/40 text-[#1db954] text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">
                      <Flame className="w-3 h-3 fill-current" />
                      Tendencia Destacada
                    </span>
                  </div>
                )}

                <h3 className="text-white font-extrabold text-base sm:text-lg truncate tracking-tight">
                  {track.title}
                </h3>
                <p
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectArtist?.(track.artist);
                  }}
                  className="text-[#b3b3b3] hover:text-white hover:underline text-xs font-medium truncate mt-0.5 cursor-pointer"
                  title={`Ver perfil de ${track.artist}`}
                >
                  {track.artist}
                </p>

                {/* Botón flotante Play en la tarjeta central */}
                {isCenter && (
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-[#727272]">
                      {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                    </span>

                    <button
                      onClick={(e) => handlePlayCurrent(track, e)}
                      className="w-12 h-12 rounded-full bg-white text-black hover:bg-[#1db954] hover:text-black transition-all flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 cursor-pointer"
                      title={isCurrentActivePlaying ? 'Pausar' : 'Reproducir'}
                    >
                      {isCurrentActivePlaying ? (
                        <Pause className="w-6 h-6 fill-current" />
                      ) : (
                        <Play className="w-6 h-6 fill-current ml-0.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Reflejo de cristal superior */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none opacity-40" />
            </div>
          );
        })}
      </div>

      {/* Flechas de Navegación del Carrusel 3D */}
      <div className="flex items-center gap-3 mt-1 z-30">
        <button
          onClick={handlePrev}
          className="w-9 h-9 rounded-full bg-black/60 hover:bg-white text-white hover:text-black border border-white/10 flex items-center justify-center transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
          title="Anterior álbum"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Indicadores de bolitas */}
        <div className="flex items-center gap-1.5 px-2">
          {displayTracks.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                activeIndex === i ? 'w-6 bg-white shadow-sm' : 'w-1.5 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="w-9 h-9 rounded-full bg-black/60 hover:bg-white text-white hover:text-black border border-white/10 flex items-center justify-center transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
          title="Siguiente álbum"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
