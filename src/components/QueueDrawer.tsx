import React, { useState, useEffect } from 'react';
import { X, Play, Trash2, ListMusic, Volume2, Compass, Plus, Radio, Zap, Sliders } from 'lucide-react';
import { usePlayerStore } from '../stores/usePlayerStore';
import { formatTime } from '../utils/formatTime';
import { recommendationEngine } from '../services/recommendation/RecommendationEngine';
import { useContextMenuStore } from '../stores/useContextMenuStore';
import { Track } from '../types';

interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Componente de Cola de Reproducción (Queue Drawer)
 * Muestra la pista en reproducción, las canciones en espera,
 * Autoplay automático, Crossfade DJ y Recomendaciones Inteligentes de Harmonia.
 */
export const QueueDrawer: React.FC<QueueDrawerProps> = ({ isOpen, onClose }) => {
  const {
    currentTrack,
    isPlaying,
    queue,
    queueIndex,
    playQueueIndex,
    removeFromQueue,
    clearQueue,
    isAutoplay,
    toggleAutoplay,
    addToQueue,
    startRadio,
    playTrack,
    crossfadeDuration,
    isCrossfadeEnabled,
    setCrossfadeDuration,
    toggleCrossfade
  } = usePlayerStore();
  const { openTrackMenu } = useContextMenuStore();

  const [recommendations, setRecommendations] = useState<Track[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  useEffect(() => {
    let active = true;
    if (!isOpen || !currentTrack) return;

    async function fetchRecs() {
      if (!currentTrack) return;
      setLoadingRecs(true);
      try {
        const recs = await recommendationEngine.getRecommendedTracks(currentTrack, queue, 4);
        if (active) {
          setRecommendations(recs);
        }
      } catch (err) {
        console.warn('Error loading recommendations in drawer:', err);
      } finally {
        if (active) setLoadingRecs(false);
      }
    }

    fetchRecs();

    return () => {
      active = false;
    };
  }, [isOpen, currentTrack?.id]);

  if (!isOpen) return null;

  const nextTracks = queue.slice(queueIndex + 1);

  return (
    <aside className="w-80 harmonia-spotlight border-l flex flex-col h-full z-20 shrink-0 select-none animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <ListMusic className="w-5 h-5 text-[#1db954]" />
          <h2 className="text-base font-bold text-white">Cola de reproducción</h2>
        </div>
        <button
          onClick={onClose}
          className="text-[#b3b3b3] hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          title="Cerrar cola"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        {/* Pista en reproducción */}
        <section>
          <h3 className="text-xs font-bold text-[#b3b3b3] uppercase tracking-wider mb-3">
            Sonando ahora
          </h3>
          {currentTrack ? (
            <div
              onContextMenu={(e) => {
                e.preventDefault();
                openTrackMenu(e.clientX, e.clientY, currentTrack);
              }}
              className="flex items-center justify-between p-3 rounded-xl harmonia-card-bg shadow-md cursor-pointer"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="relative w-12 h-12 rounded overflow-hidden shrink-0">
                  <img
                    src={currentTrack.coverUrl}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                  {isPlaying && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Volume2 className="w-5 h-5 text-[#1db954] animate-pulse" />
                    </div>
                  )}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-[#1db954] truncate">
                    {currentTrack.title}
                  </p>
                  <p className="text-xs text-[#b3b3b3] truncate">{currentTrack.artist}</p>
                </div>
              </div>

              <span className="text-xs text-[#b3b3b3] font-mono shrink-0 ml-2">
                {formatTime(currentTrack.duration)}
              </span>
            </div>
          ) : (
            <p className="text-xs text-[#727272]">No hay ninguna pista sonando.</p>
          )}
        </section>

        {/* Pistas a continuación */}
        <section className="flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-[#b3b3b3] uppercase tracking-wider">
              A continuación ({nextTracks.length})
            </h3>
            {nextTracks.length > 0 && (
              <button
                onClick={clearQueue}
                className="text-xs text-[#b3b3b3] hover:text-white transition-colors cursor-pointer"
              >
                Borrar cola
              </button>
            )}
          </div>

          {/* Autoplay Toggle Switch estilo Spotify */}
          <div className="flex items-center justify-between p-2.5 mb-2 harmonia-card-bg rounded-xl">
            <div className="flex items-center gap-2">
              <Zap className={`w-4 h-4 ${isAutoplay ? 'text-[#1db954]' : 'text-[#727272]'}`} />
              <div>
                <p className="text-xs font-medium text-white">Autoplay Inteligente</p>
                <p className="text-[10px] text-[#b3b3b3]">Continúa con música similar al terminar</p>
              </div>
            </div>
            <button
              onClick={toggleAutoplay}
              className={`w-9 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                isAutoplay ? 'bg-[#1db954]' : 'bg-[#3e3e3e]'
              }`}
              title={isAutoplay ? 'Desactivar Autoplay' : 'Activar Autoplay'}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  isAutoplay ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Crossfade DJ Toggle & Slider */}
          <div className="flex items-center justify-between p-2.5 mb-3 harmonia-card-bg rounded-xl">
            <div className="flex items-center gap-2">
              <Sliders className={`w-4 h-4 ${isCrossfadeEnabled ? 'text-[#1db954]' : 'text-[#727272]'}`} />
              <div>
                <p className="text-xs font-medium text-white">Crossfade DJ</p>
                <p className="text-[10px] text-[#b3b3b3]">
                  {isCrossfadeEnabled ? `${crossfadeDuration}s de fundido sin pausas` : 'Desactivado'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isCrossfadeEnabled && (
                <input
                  type="range"
                  min={1}
                  max={12}
                  value={crossfadeDuration}
                  onChange={(e) => setCrossfadeDuration(Number(e.target.value))}
                  className="w-16 h-1 bg-[#4d4d4d] rounded-lg appearance-none cursor-pointer accent-[#1db954]"
                  title={`Duración del fundido: ${crossfadeDuration} segundos`}
                />
              )}
              <button
                onClick={toggleCrossfade}
                className={`w-9 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                  isCrossfadeEnabled ? 'bg-[#1db954]' : 'bg-[#3e3e3e]'
                }`}
                title={isCrossfadeEnabled ? 'Desactivar Crossfade' : 'Activar Crossfade'}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    isCrossfadeEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {nextTracks.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#727272] border border-dashed border-[#282828] rounded-lg">
              {isAutoplay
                ? 'La cola está vacía. Al terminar esta pista, el Autoplay encolará recomendaciones.'
                : 'No hay más canciones en la cola.'}
            </div>
          ) : (
            <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
              {nextTracks.map((track, relativeIndex) => {
                const actualIndex = queueIndex + 1 + relativeIndex;
                return (
                  <div
                    key={`${track.id}-${actualIndex}`}
                    className="flex items-center justify-between p-2 rounded-xl harmonia-table-row group cursor-pointer transition-all"
                    onClick={() => playQueueIndex(actualIndex)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      openTrackMenu(e.clientX, e.clientY, track);
                    }}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="relative w-9 h-9 rounded overflow-hidden shrink-0">
                        <img
                          src={track.coverUrl}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                        </div>
                      </div>

                      <div className="overflow-hidden">
                        <p className="text-xs font-semibold text-white truncate group-hover:text-[#1db954] transition-colors">
                          {track.title}
                        </p>
                        <p className="text-[11px] text-[#b3b3b3] truncate">{track.artist}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-xs text-[#b3b3b3] font-mono group-hover:hidden">
                        {formatTime(track.duration)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromQueue(actualIndex);
                        }}
                        className="p-1 text-[#727272] hover:text-rose-400 hidden group-hover:block transition-colors"
                        title="Quitar de la cola"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Sección de Recomendaciones Algorítmicas de Harmonia (Estilo Spotify List Extender) */}
        {currentTrack && (
          <section className="border-t border-[#222] pt-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-[#1db954]" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Recomendados para ti
                </h3>
              </div>
              <button
                onClick={() => startRadio(currentTrack)}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#1db954] hover:text-[#1ed760] transition-colors cursor-pointer"
                title="Generar mix de 15 pistas similares"
              >
                <Radio className="w-3 h-3" />
                Iniciar Radio
              </button>
            </div>

            <p className="text-[11px] text-[#727272]">
              Basado en afinidad de artista y señales de escucha reciente.
            </p>

            {loadingRecs ? (
              <div className="py-4 text-center text-xs text-[#727272] animate-pulse">
                Calculando afinidades de recomendación...
              </div>
            ) : recommendations.length === 0 ? (
              <div className="text-xs text-[#727272] py-2">
                No hay más recomendaciones para esta pista.
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {recommendations.map((track) => (
                  <div
                    key={`rec-${track.id}`}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-[#202020] group cursor-pointer transition-colors"
                    onClick={() => playTrack(track)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      openTrackMenu(e.clientX, e.clientY, track);
                    }}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <img
                        src={track.coverUrl}
                        alt={track.title}
                        className="w-9 h-9 rounded object-cover shrink-0"
                      />
                      <div className="overflow-hidden">
                        <p className="text-xs font-semibold text-white truncate group-hover:text-[#1db954] transition-colors">
                          {track.title}
                        </p>
                        <p className="text-[11px] text-[#b3b3b3] truncate">{track.artist}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToQueue(track);
                        }}
                        className="p-1 rounded bg-[#2a2a2a] hover:bg-[#1db954] text-[#b3b3b3] hover:text-black transition-colors"
                        title="Añadir a la cola"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </aside>
  );
};
