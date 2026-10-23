import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Heart,
  ListMusic,
  Radio,
  Mic2,
  PictureInPicture2,
  PanelRight,
  PanelRightClose,
  SlidersHorizontal,
  Moon
} from 'lucide-react';
import { usePlayerStore } from '../stores/usePlayerStore';
import { useContextMenuStore } from '../stores/useContextMenuStore';
import { useEqualizerStore } from '../stores/useEqualizerStore';
import { useSleepTimerStore } from '../stores/useSleepTimerStore';
import { formatTime } from '../utils/formatTime';

interface PlayerBarProps {
  isQueueOpen: boolean;
  onToggleQueue: () => void;
  isLyricsActive?: boolean;
  onToggleLyrics?: () => void;
  isMiniPlayerOpen?: boolean;
  onToggleMiniPlayer?: () => void;
  isSpotlightOpen?: boolean;
  onToggleSpotlight?: () => void;
  onNavigateToArtist?: (artistName: string) => void;
}

/**
 * PlayerBar:
 * Barra de reproducción inferior persistente con estética Glassmorphism.
 * Incluye visualizador dinámico de audio waveform en vivo, selector de panel spotlight
 * (Columna 3 de Apple Music), atajos rápidos de letras, cola y PiP.
 */
export const PlayerBar: React.FC<PlayerBarProps> = ({
  isQueueOpen,
  onToggleQueue,
  isLyricsActive = false,
  onToggleLyrics,
  isMiniPlayerOpen = false,
  onToggleMiniPlayer,
  isSpotlightOpen = false,
  onToggleSpotlight,
  onNavigateToArtist
}) => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    likedTrackIds,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    toggleLike,
    startRadio
  } = usePlayerStore();

  const { openTrackMenu } = useContextMenuStore();
  const { isModalOpen: isEqOpen, toggleModal: toggleEqModal, isEnabled: isEqEnabled } = useEqualizerStore();
  const {
    isActive: isSleepActive,
    remainingSeconds: sleepRemaining,
    isModalOpen: isSleepModalOpen,
    toggleModal: toggleSleepModal
  } = useSleepTimerStore();

  const isLiked = currentTrack ? likedTrackIds.has(currentTrack.id) : false;

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek(Number(e.target.value));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(e.target.value));
  };

  return (
    <footer className="h-22 harmonia-playerbar px-5 flex items-center justify-between select-none z-40 shrink-0">
      {/* Left: Track Information & Live Waveform */}
      <div
        onContextMenu={(e) => {
          if (currentTrack) {
            e.preventDefault();
            openTrackMenu(e.clientX, e.clientY, currentTrack);
          }
        }}
        className="flex items-center gap-3.5 w-1/4 min-w-[200px]"
      >
        {currentTrack ? (
          <>
            <div className="relative group shrink-0">
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className="w-14 h-14 rounded-xl object-cover shadow-lg border border-white/10"
              />
              {/* Mini Waveform Equalizer sobre la carátula */}
              {isPlaying && (
                <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center pointer-events-none">
                  <div className="flex items-end gap-0.5 h-3.5">
                    <span className="w-0.5 bg-[#1db954] rounded-full animate-wave-1 h-3" />
                    <span className="w-0.5 bg-[#1db954] rounded-full animate-wave-2 h-2" />
                    <span className="w-0.5 bg-[#1db954] rounded-full animate-wave-3 h-3.5" />
                  </div>
                </div>
              )}
            </div>

            <div className="overflow-hidden">
              <p
                onClick={onToggleSpotlight}
                className="text-white text-sm font-semibold truncate hover:underline cursor-pointer tracking-tight"
                title="Abrir detalles de la canción"
              >
                {currentTrack.title}
              </p>
              <p
                onClick={() => onNavigateToArtist && onNavigateToArtist(currentTrack.artist)}
                className="text-[#b3b3b3] hover:text-white text-xs truncate hover:underline cursor-pointer mt-0.5"
                title={`Ir al perfil de ${currentTrack.artist}`}
              >
                {currentTrack.artist}
              </p>
            </div>

            <button
              onClick={() => toggleLike(currentTrack.id)}
              className="p-1.5 text-[#b3b3b3] hover:text-white transition-colors ml-1 cursor-pointer"
              title={isLiked ? 'Quitar de tus Me Gusta (L)' : 'Guardar en tus Me Gusta (L)'}
            >
              <Heart
                className={`w-4 h-4 transition-transform active:scale-125 ${
                  isLiked ? 'text-[#1db954] fill-[#1db954]' : ''
                }`}
              />
            </button>

            <button
              onClick={() => currentTrack && startRadio(currentTrack)}
              className="p-1.5 text-[#b3b3b3] hover:text-[#1db954] transition-colors cursor-pointer"
              title="Iniciar Radio de la pista (Mix automático de canciones similares)"
            >
              <Radio className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="text-xs text-[#727272]">No hay pista seleccionada</div>
        )}
      </div>

      {/* Center: Playback Controls & Progress Bar */}
      <div className="flex flex-col items-center gap-1.5 w-2/4 max-w-[650px]">
        {/* Buttons */}
        <div className="flex items-center gap-5">
          <button
            onClick={toggleShuffle}
            title="Activar aleatorio (S)"
            className={`transition-colors cursor-pointer p-1 rounded-full ${
              isShuffle ? 'text-[#1db954]' : 'text-[#b3b3b3] hover:text-white'
            }`}
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={prevTrack}
            title="Anterior (P)"
            className="text-[#b3b3b3] hover:text-white transition-colors cursor-pointer p-1"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={togglePlay}
            title={isPlaying ? 'Pausa (Espacio)' : 'Reproducir (Espacio)'}
            className="w-10 h-10 rounded-full bg-white hover:scale-105 active:scale-95 flex items-center justify-center text-black transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={nextTrack}
            title="Siguiente (N)"
            className="text-[#b3b3b3] hover:text-white transition-colors cursor-pointer p-1"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={toggleRepeat}
            title="Repetir (R)"
            className={`transition-colors cursor-pointer p-1 rounded-full ${
              repeatMode !== 'off' ? 'text-[#1db954]' : 'text-[#b3b3b3] hover:text-white'
            }`}
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="w-4 h-4" />
            ) : (
              <Repeat className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Timeline Slider */}
        <div className="w-full flex items-center gap-2 text-xs text-[#b3b3b3] font-mono">
          <span className="w-10 text-right">{formatTime(currentTime)}</span>
          <div className="relative flex-1 flex items-center group">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleProgressChange}
              className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#1db954] hover:accent-[#1ed760] transition-colors"
            />
          </div>
          <span className="w-10">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Right: Volume, Spotlight Toggle, Queue & Lyrics */}
      <div className="flex items-center justify-end gap-2.5 w-1/4 min-w-[200px]">
        {/* Botón de Ecualizador Gráfico */}
        <button
          onClick={toggleEqModal}
          title={isEqOpen ? 'Cerrar ecualizador' : 'Ecualizador gráfico de audio (EQ)'}
          className={`relative transition-colors p-2 rounded-xl hover:bg-white/10 cursor-pointer ${
            isEqOpen
              ? 'text-[#1db954] bg-white/10'
              : isEqEnabled
              ? 'text-white'
              : 'text-[#b3b3b3] hover:text-white'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          {isEqEnabled && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#1db954]" />
          )}
        </button>

        {/* Botón de Temporizador de Apagado (Sleep Timer) */}
        <button
          onClick={toggleSleepModal}
          title={
            isSleepActive
              ? `Temporizador activo: ${formatTime(sleepRemaining)} restante`
              : 'Temporizador de apagado (Sleep Timer)'
          }
          className={`relative transition-all p-2 rounded-xl hover:bg-white/10 cursor-pointer flex items-center gap-1.5 ${
            isSleepModalOpen
              ? 'text-indigo-400 bg-white/10'
              : isSleepActive
              ? 'text-indigo-400 bg-indigo-500/15 border border-indigo-500/30 shadow-sm shadow-indigo-500/20'
              : 'text-[#b3b3b3] hover:text-white'
          }`}
        >
          <Moon className="w-4 h-4" />
          {isSleepActive && (
            <span className="text-[11px] font-mono font-bold tracking-tight text-indigo-300">
              {formatTime(sleepRemaining)}
            </span>
          )}
        </button>

        {/* Botón de Letras Sincronizadas */}
        {onToggleLyrics && (
          <button
            onClick={onToggleLyrics}
            title={isLyricsActive ? 'Cerrar letras' : 'Ver letras sincronizadas (Karaoke)'}
            className={`transition-colors p-2 rounded-xl hover:bg-white/10 cursor-pointer ${
              isLyricsActive ? 'text-[#1db954] bg-white/10' : 'text-[#b3b3b3] hover:text-white'
            }`}
          >
            <Mic2 className="w-4 h-4" />
          </button>
        )}

        {/* Botón de Cola de Reproducción */}
        <button
          onClick={onToggleQueue}
          title="Cola de reproducción"
          className={`transition-colors p-2 rounded-xl hover:bg-white/10 cursor-pointer ${
            isQueueOpen ? 'text-[#1db954] bg-white/10' : 'text-[#b3b3b3] hover:text-white'
          }`}
        >
          <ListMusic className="w-4 h-4" />
        </button>

        {/* Botón de Mini-Player Flotante */}
        {onToggleMiniPlayer && (
          <button
            onClick={onToggleMiniPlayer}
            title={isMiniPlayerOpen ? 'Cerrar mini reproductor' : 'Abrir mini reproductor flotante (PiP)'}
            className={`transition-colors p-2 rounded-xl hover:bg-white/10 cursor-pointer ${
              isMiniPlayerOpen ? 'text-[#1db954] bg-white/10' : 'text-[#b3b3b3] hover:text-white'
            }`}
          >
            <PictureInPicture2 className="w-4 h-4" />
          </button>
        )}

        {/* Botón de Panel Spotlight (3ª Columna estilo Apple Music) */}
        {onToggleSpotlight && (
          <button
            onClick={onToggleSpotlight}
            title={isSpotlightOpen ? 'Ocultar panel lateral (Spotlight)' : 'Mostrar panel lateral (Spotlight 3D)'}
            className={`transition-colors p-2 rounded-xl hover:bg-white/10 cursor-pointer ${
              isSpotlightOpen ? 'text-[#1db954] bg-white/10' : 'text-[#b3b3b3] hover:text-white'
            }`}
          >
            {isSpotlightOpen ? (
              <PanelRightClose className="w-4 h-4" />
            ) : (
              <PanelRight className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Control de Volumen */}
        <div className="flex items-center gap-1.5 ml-1">
          <button
            onClick={toggleMute}
            className="text-[#b3b3b3] hover:text-white transition-colors p-1"
            title={isMuted ? 'Activar sonido (M)' : 'Silenciar (M)'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#1db954] hover:accent-[#1ed760]"
          />
        </div>
      </div>
    </footer>
  );
};
