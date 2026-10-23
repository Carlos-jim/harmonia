import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Share2, Check, Flame, Trophy, Moon, Heart, Crown, Compass, Zap } from 'lucide-react';
import { soundCapsuleService, SoundCapsuleData } from '../services/recommendation/SoundCapsuleService';

interface SoundCapsuleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SoundCapsuleModal: React.FC<SoundCapsuleModalProps> = ({ isOpen, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [capsuleData, setCapsuleData] = useState<SoundCapsuleData | null>(null);
  const [copied, setCopied] = useState(false);

  const TOTAL_SLIDES = 4;

  useEffect(() => {
    if (isOpen) {
      const data = soundCapsuleService.generateCapsuleData();
      setCapsuleData(data);
      setCurrentSlide(0);
      setCopied(false);
    }
  }, [isOpen]);

  // Teclado: Flechas izquierda y derecha para cambiar de slide
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        e.preventDefault();
        setCurrentSlide((prev) => (prev < TOTAL_SLIDES - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentSlide((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !capsuleData) return null;

  const handleNext = () => {
    if (currentSlide < TOTAL_SLIDES - 1) {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(capsuleData.shareableSummary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Failed to copy summary:', err);
    }
  };

  const archetype = capsuleData.archetype;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-2xl flex items-center justify-center p-4 select-none animate-in fade-in duration-300">
      {/* Contenedor tipo Stories / Wrapped de Spotify */}
      <div className={`relative w-full max-w-md h-[640px] max-h-[92vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between text-white border border-white/10 bg-gradient-to-br ${archetype.gradient} transition-all duration-700`}>
        
        {/* Glow ambiental superior */}
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-white/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-black/40 blur-3xl pointer-events-none" />

        {/* Header: Barra de progreso segmentada */}
        <div className="relative z-20 pt-4 px-4 flex flex-col gap-3">
          <div className="flex gap-1.5 w-full">
            {Array.from({ length: TOTAL_SLIDES }).map((_, idx) => (
              <div
                key={idx}
                className="h-1 flex-1 rounded-full bg-white/20 overflow-hidden"
              >
                <div
                  className={`h-full bg-white transition-all duration-300 ${
                    idx < currentSlide
                      ? 'w-full'
                      : idx === currentSlide
                      ? 'w-full animate-pulse'
                      : 'w-0'
                  }`}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs tracking-wider font-bold">
            <div className="flex items-center gap-1.5 text-white/90">
              <Crown className="w-3.5 h-3.5 text-amber-300" />
              <span className="uppercase text-[11px] font-black">Harmonia Wrapped</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full bg-black/30 hover:bg-black/60 text-white/80 hover:text-white transition-colors"
              title="Cerrar (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Zona central interactiva (con soporte de clic izquierda/derecha para navegar) */}
        <div className="relative z-10 flex-1 px-6 py-4 flex flex-col justify-center">
          
          {/* SLIDE 0: Minutos de Música */}
          {currentSlide === 0 && (
            <div className="flex flex-col items-center text-center gap-6 animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 rounded-full bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center shadow-lg">
                <Flame className="w-10 h-10 text-amber-300 animate-bounce" />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-widest text-white/70 font-semibold">
                  Tu tiempo en sintonía
                </span>
                <div className="text-6xl font-black tracking-tight text-white drop-shadow-md">
                  {capsuleData.totalMinutes}
                </div>
                <span className="text-lg font-bold text-white/90">
                  minutos de música disfrutados
                </span>
                <p className="text-xs text-white/70 mt-1 max-w-xs">
                  Acompañando tus días a través de {capsuleData.totalPlays} canciones reproducidas con máxima fidelidad.
                </p>
              </div>

              <div className="bg-black/25 backdrop-blur-md rounded-2xl p-3 border border-white/10 w-full text-xs flex items-center justify-around">
                <div className="flex flex-col items-center">
                  <span className="text-white/60">Canciones</span>
                  <span className="text-base font-extrabold">{capsuleData.totalPlays}</span>
                </div>
                <div className="w-px h-8 bg-white/15" />
                <div className="flex flex-col items-center">
                  <span className="text-white/60">Equivalente</span>
                  <span className="text-base font-extrabold">{(capsuleData.totalMinutes / 60).toFixed(1)} hrs</span>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 1: Top 5 Artistas */}
          {currentSlide === 1 && (
            <div className="flex flex-col gap-4 animate-in slide-in-from-right-8 duration-300">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-5 h-5 text-amber-300" />
                <h3 className="text-lg font-black tracking-tight uppercase">Tus Artistas Dominantes</h3>
              </div>

              <div className="flex flex-col gap-2.5">
                {capsuleData.topArtists.slice(0, 5).map((artist, idx) => (
                  <div
                    key={artist.name}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      idx === 0
                        ? 'bg-white/20 border-white/40 shadow-xl scale-[1.02]'
                        : 'bg-black/25 border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 text-center font-black ${idx === 0 ? 'text-amber-300 text-lg' : 'text-white/60 text-sm'}`}>
                        #{artist.rank}
                      </span>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm leading-tight text-white">
                          {artist.name}
                        </span>
                        {idx === 0 && (
                          <span className="text-[10px] text-amber-200 font-semibold flex items-center gap-1">
                            <Trophy className="w-3 h-3 text-amber-300" />
                            <span>Tu #1 Incondicional</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-white/15 h-2 rounded-full overflow-hidden hidden sm:block">
                        <div
                          className="bg-white h-full rounded-full"
                          style={{ width: `${artist.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono font-bold text-white/80">
                        {artist.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SLIDE 2: Tasa de Satisfacción & Hábitos */}
          {currentSlide === 2 && (
            <div className="flex flex-col items-center text-center gap-5 animate-in slide-in-from-right-8 duration-300">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-400/40 backdrop-blur-md flex items-center justify-center shadow-lg">
                <Heart className="w-10 h-10 text-emerald-300 animate-pulse" />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-widest text-white/70 font-semibold">
                  Tasa de Satisfacción Sonora
                </span>
                <div className="text-5xl font-black text-white">
                  {capsuleData.satisfactionRate}%
                </div>
                <p className="text-xs text-white/80 max-w-xs mt-1">
                  Porcentaje de canciones que superaron con éxito la <strong className="text-white">Regla de los 30 segundos</strong> de Spotify sin saltar.
                </p>
              </div>

              <div className="bg-black/30 backdrop-blur-md rounded-2xl p-4 border border-white/10 w-full flex flex-col gap-2 text-left">
                <div className="flex items-center gap-2 text-xs font-bold text-white/80">
                  <Moon className="w-4 h-4 text-indigo-300" />
                  <span>Tu Horario Más Activo:</span>
                </div>
                <div className="text-sm font-extrabold text-white pl-6">
                  {capsuleData.peakListeningTime}
                </div>
                <div className="text-[11px] text-white/60 pl-6">
                  {capsuleData.totalSkips === 0
                    ? '¡Oído impecable! Prácticamente nunca diste skip a una recomendación.'
                    : `Realizaste solo ${capsuleData.totalSkips} skips rápidos para filtrar tu gusto.`}
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 3: Revelación del Arquetipo */}
          {currentSlide === 3 && (
            <div className="flex flex-col items-center text-center gap-4 animate-in zoom-in-90 duration-300">
              <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center drop-shadow-xl animate-bounce">
                {archetype.id === 'nocturnal' && <Moon className="w-12 h-12 text-indigo-300" />}
                {archetype.id === 'purist' && <Crown className="w-12 h-12 text-emerald-300" />}
                {archetype.id === 'rhythm_devotee' && <Flame className="w-12 h-12 text-amber-400" />}
                {archetype.id === 'exigent_critic' && <Zap className="w-12 h-12 text-rose-400" />}
                {archetype.id === 'urban_explorer' && <Compass className="w-12 h-12 text-cyan-400" />}
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full font-bold self-center text-white/90">
                  Tu Arquetipo Musical
                </span>
                <h2 className="text-3xl font-black tracking-tight text-white mt-1">
                  {archetype.title}
                </h2>
                <span className="text-xs italic text-white/80 font-medium">
                  "{archetype.tagline}"
                </span>
              </div>

              <p className="text-xs text-white/85 leading-relaxed bg-black/25 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                {archetype.description}
              </p>

              <div className="flex flex-wrap justify-center gap-1.5">
                {archetype.traits.map((trait) => (
                  <span
                    key={trait}
                    className="flex items-center gap-1 text-[10px] font-semibold bg-white/15 px-2.5 py-1 rounded-full border border-white/15"
                  >
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>{trait}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer: Controles de navegación y acción */}
        <div className="relative z-20 p-4 bg-black/20 backdrop-blur-md flex items-center justify-between border-t border-white/10">
          <button
            onClick={handlePrev}
            disabled={currentSlide === 0}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {currentSlide === TOTAL_SLIDES - 1 ? (
            <button
              onClick={handleCopySummary}
              className="flex items-center gap-2 bg-white text-black font-bold text-xs px-4 py-2 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-transform"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Copiar Resumen</span>
                </>
              )}
            </button>
          ) : (
            <span className="text-xs text-white/60 font-medium">
              {currentSlide + 1} de {TOTAL_SLIDES}
            </span>
          )}

          <button
            onClick={handleNext}
            disabled={currentSlide === TOTAL_SLIDES - 1}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

      </div>
    </div>
  );
};
