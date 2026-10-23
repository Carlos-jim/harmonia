import React, { useState } from 'react';
import {
  X,
  Moon,
  Clock,
  Music,
  Plus,
  PowerOff,
  Check,
  Sparkles
} from 'lucide-react';
import { useSleepTimerStore } from '../stores/useSleepTimerStore';
import { formatTime } from '../utils/formatTime';

const SLEEP_PRESETS = [
  { label: '5 min', minutes: 5 },
  { label: '10 min', minutes: 10 },
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: '45 min', minutes: 45 },
  { label: '1 hora', minutes: 60 }
];

export const SleepTimerModal: React.FC = () => {
  const {
    isActive,
    mode,
    remainingSeconds,
    totalDurationSeconds,
    isFadingOut,
    isModalOpen,
    startTimer,
    startEndOfTrackTimer,
    addMinutes,
    cancelTimer,
    closeModal
  } = useSleepTimerStore();

  const [customMinutes, setCustomMinutes] = useState<number>(20);

  if (!isModalOpen) return null;

  const progressPercent =
    totalDurationSeconds > 0
      ? Math.max(0, Math.min(100, (remainingSeconds / totalDurationSeconds) * 100))
      : 100;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sleep-timer-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div className="harmonia-modal-glass rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col border border-white/10 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="sleep-timer-title" className="text-lg font-bold text-white tracking-tight">
                  Temporizador de Apagado
                </h2>
                {isActive && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#1db954]/20 text-[#1db954] border border-[#1db954]/30 animate-pulse">
                    Activo
                  </span>
                )}
              </div>
              <p className="text-xs text-[#a0a0a0] mt-0.5">
                Desconexión gradual con fundido de audio para dormir
              </p>
            </div>
          </div>

          <button
            onClick={closeModal}
            className="text-[#b3b3b3] hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5">
          {/* Active Countdown Card */}
          {isActive ? (
            <div className="relative p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-black/60 border border-indigo-500/30 flex flex-col items-center justify-center text-center overflow-hidden">
              <div className="absolute top-3 right-3 flex items-center gap-1.5 text-[10px] font-mono text-indigo-300">
                <Clock className="w-3 h-3" />
                <span>{mode === 'end_of_track' ? 'Al fin de pista' : 'Cuenta regresiva'}</span>
              </div>

              {/* Digital Time Countdown */}
              <div className="my-2">
                <span className="text-5xl font-mono font-black tracking-tight text-white drop-shadow-md">
                  {formatTime(remainingSeconds)}
                </span>
                {isFadingOut && (
                  <p className="text-xs text-amber-400 font-semibold mt-1 animate-pulse">
                    Atenuando volumen suavemente...
                  </p>
                )}
              </div>

              {/* Progress Bar */}
              {mode === 'duration' && (
                <div className="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              )}

              {/* Action Buttons: Add 5m / Cancel */}
              <div className="flex items-center gap-2 mt-4 w-full">
                <button
                  onClick={() => addMinutes(5)}
                  className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Añadir 5 minutos más"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+5 min</span>
                </button>
                <button
                  onClick={cancelTimer}
                  className="flex-1 py-2 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <PowerOff className="w-3.5 h-3.5" />
                  <span>Cancelar</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3 text-xs text-[#a0a0a0]">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                Selecciona cuándo deseas que la música se detenga. El reproductor bajará el volumen en los últimos 3 segundos para una pausa natural.
              </span>
            </div>
          )}

          {/* Special Option: End of current track */}
          <div>
            <button
              onClick={() => {
                startEndOfTrackTimer();
                closeModal();
              }}
              className={`w-full p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-left group ${
                isActive && mode === 'end_of_track'
                  ? 'bg-indigo-600/30 border-indigo-500/60 text-white'
                  : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/10 text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                  <Music className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold">Al finalizar la canción actual</p>
                  <p className="text-[11px] text-[#888]">
                    Detiene la reproducción al terminar la pista que está sonando
                  </p>
                </div>
              </div>
              {isActive && mode === 'end_of_track' && (
                <Check className="w-4 h-4 text-indigo-400 shrink-0" />
              )}
            </button>
          </div>

          {/* Quick Presets Grid */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#a0a0a0] block mb-2">
              Tiempos Predefinidos
            </span>
            <div className="grid grid-cols-3 gap-2">
              {SLEEP_PRESETS.map((preset) => (
                <button
                  key={preset.minutes}
                  onClick={() => {
                    startTimer(preset.minutes);
                    closeModal();
                  }}
                  className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] hover:border-indigo-500/40 border border-white/10 text-center transition-all cursor-pointer group"
                >
                  <p className="text-sm font-bold text-white group-hover:text-indigo-300">
                    {preset.label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Minute Slider */}
          <div className="p-4 rounded-xl bg-black/30 border border-white/5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Tiempo Personalizado</span>
              <span className="text-xs font-mono font-bold text-indigo-400">
                {customMinutes} minutos
              </span>
            </div>

            <input
              type="range"
              min="1"
              max="120"
              step="1"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(Number(e.target.value))}
              className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />

            <button
              onClick={() => {
                startTimer(customMinutes);
                closeModal();
              }}
              className="w-full mt-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-indigo-900/30"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Iniciar por {customMinutes} min</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 px-6 border-t border-white/10 bg-black/40 flex items-center justify-between text-xs text-[#888]">
          <span className="text-[11px]">Anti-Corte: fade-out de 3s al expirar</span>
          <button
            onClick={closeModal}
            className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white font-semibold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
