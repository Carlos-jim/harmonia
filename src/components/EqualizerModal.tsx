import React from 'react';
import {
  X,
  SlidersHorizontal,
  RotateCcw,
  Activity,
  Check,
  Volume2
} from 'lucide-react';
import { useEqualizerStore } from '../stores/useEqualizerStore';

export const EqualizerModal: React.FC = () => {
  const {
    isEnabled,
    activePresetId,
    bands,
    presets,
    isModalOpen,
    setBandGain,
    applyPreset,
    toggleEnabled,
    resetToFlat,
    closeModal
  } = useEqualizerStore();

  if (!isModalOpen) return null;

  const currentPreset = presets.find((p) => p.id === activePresetId) || {
    id: 'custom',
    name: 'Personalizado',
    description: 'Curva de ecualización ajustada manualmente por el usuario.',
    gains: [0, 0, 0, 0, 0, 0]
  };

  // Coordenadas para el trazado SVG de la curva de ecualización (Catmull-Rom a Bezier cúbica)
  const svgWidth = 600;
  const svgHeight = 150;
  const zeroY = svgHeight / 2; // 75px representa 0 dB

  // Coordenadas X para las 6 bandas distribuidas uniformemente
  const bandXs = [60, 160, 260, 360, 460, 540];

  // Calcular las coordenadas (x, y) de cada punto de la curva
  const points = bands.map((band, idx) => {
    const x = bandXs[idx];
    const gain = isEnabled ? band.gain : 0;
    // Rango de -12dB a +12dB mapeado a (svgHeight - 15) hasta 15
    const y = zeroY - (gain / 12) * (zeroY - 20);
    return { x, y };
  });

  // Generar curva suave bezier a través de los puntos
  const buildSmoothCurvePath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    let d = `M 0,${pts[0].y} L ${pts[0].x},${pts[0].y}`;

    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x},${p2.y}`;
    }

    d += ` L ${svgWidth},${pts[pts.length - 1].y}`;
    return d;
  };

  const curveLinePath = buildSmoothCurvePath(points);
  const curveAreaPath = `${curveLinePath} L ${svgWidth},${svgHeight} L 0,${svgHeight} Z`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="equalizer-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div className="harmonia-modal-glass rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col border border-white/10 max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1db954]/20 border border-[#1db954]/40 flex items-center justify-center text-[#1db954]">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="equalizer-title" className="text-lg font-bold text-white tracking-tight">
                  Ecualizador Gráfico
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#1db954]/20 text-[#1db954] border border-[#1db954]/30">
                  6 Bandas REA
                </span>
              </div>
              <p className="text-xs text-[#a0a0a0] mt-0.5">
                Calibración de respuesta en frecuencia con Web Audio API de 64 bits
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Toggle Switch On/Off (Bypass) */}
            <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-full border border-white/5">
              <span className="text-xs font-medium text-[#b3b3b3]">
                {isEnabled ? 'Activo' : 'Bypass'}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={isEnabled}
                onClick={toggleEnabled}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  isEnabled ? 'bg-[#1db954]' : 'bg-[#3e3e3e]'
                }`}
                title={isEnabled ? 'Desactivar ecualizador (Bypass)' : 'Activar ecualizador'}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                    isEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <button
              onClick={closeModal}
              className="text-[#b3b3b3] hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              title="Cerrar ecualizador"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5">
          {/* Preset Selector Chips */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#a0a0a0]">
                Preajustes Oficiales
              </span>
              {activePresetId !== 'flat' && (
                <button
                  onClick={resetToFlat}
                  className="text-xs text-[#1db954] hover:text-[#1ed760] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restablecer a Plano</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {presets.map((preset) => {
                const isSelected = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#1db954] text-black font-semibold shadow-md shadow-[#1db954]/25 scale-102'
                        : 'bg-white/5 hover:bg-white/10 text-[#d0d0d0] border border-white/5'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    <span>{preset.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Descripción del Preset activo */}
            <div className="mt-2 px-3 py-2 rounded-lg bg-black/25 border border-white/5 flex items-center gap-2.5 text-xs text-[#b3b3b3]">
              <Activity className="w-4 h-4 text-[#1db954] shrink-0" />
              <p className="leading-snug">{currentPreset.description}</p>
            </div>
          </div>

          {/* Gráfico Visual de Curva de Frecuencia (Spline SVG) */}
          <div className="relative rounded-xl bg-black/40 border border-white/10 p-3 overflow-hidden">
            <div className="absolute top-2 left-3 flex items-center gap-2 text-[10px] text-[#727272] uppercase tracking-wider font-semibold">
              <Volume2 className="w-3 h-3 text-[#1db954]" />
              <span>Curva de Respuesta Dinámica</span>
            </div>

            {/* Escala vertical de dB */}
            <div className="absolute right-3 top-3 bottom-3 flex flex-col justify-between text-[10px] text-[#555] font-mono pointer-events-none text-right">
              <span>+12 dB</span>
              <span>+6 dB</span>
              <span className="text-[#888]">0 dB</span>
              <span>-6 dB</span>
              <span>-12 dB</span>
            </div>

            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-32 overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="eqCurveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1db954" stopOpacity={isEnabled ? '0.45' : '0.1'} />
                  <stop offset="70%" stopColor="#1db954" stopOpacity={isEnabled ? '0.15' : '0.03'} />
                  <stop offset="100%" stopColor="#1db954" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Líneas guía de cuadrícula */}
              <line
                x1="0"
                y1={zeroY - (6 / 12) * (zeroY - 20)}
                x2={svgWidth}
                y2={zeroY - (6 / 12) * (zeroY - 20)}
                stroke="rgba(255,255,255,0.05)"
                strokeDasharray="4 4"
              />
              {/* Línea central de 0 dB */}
              <line
                x1="0"
                y1={zeroY}
                x2={svgWidth}
                y2={zeroY}
                stroke={isEnabled ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)'}
                strokeWidth="1.2"
              />
              <line
                x1="0"
                y1={zeroY + (6 / 12) * (zeroY - 20)}
                x2={svgWidth}
                y2={zeroY + (6 / 12) * (zeroY - 20)}
                stroke="rgba(255,255,255,0.05)"
                strokeDasharray="4 4"
              />

              {/* Relleno translúcido bajo la curva */}
              <path d={curveAreaPath} fill="url(#eqCurveGradient)" />

              {/* Trazado continuo brillante de la curva */}
              <path
                d={curveLinePath}
                fill="none"
                stroke={isEnabled ? '#1db954' : '#666'}
                strokeWidth="2.5"
                strokeLinecap="round"
                className="transition-all duration-150"
              />

              {/* Nodos de control circulares en cada banda */}
              {points.map((pt, i) => (
                <g key={i}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="4.5"
                    fill={isEnabled ? '#1db954' : '#888'}
                    stroke="#121212"
                    strokeWidth="2"
                    className="transition-all duration-150"
                  />
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="9"
                    fill="transparent"
                    className="hover:stroke-[#1db954]/50 hover:stroke-2 cursor-pointer"
                  />
                </g>
              ))}
            </svg>
          </div>

          {/* 6 Controles Deslizantes Verticales (Faders) */}
          <div className="grid grid-cols-6 gap-2 pt-2">
            {bands.map((band, index) => {
              const currentGain = isEnabled ? band.gain : 0;
              const formattedGain =
                band.gain > 0 ? `+${band.gain.toFixed(1)}` : `${band.gain.toFixed(1)}`;

              return (
                <div
                  key={band.frequency}
                  className="flex flex-col items-center gap-2 p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 transition-colors group"
                >
                  {/* Badge de ganancia en dB */}
                  <span
                    className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded transition-colors ${
                      band.gain !== 0 && isEnabled
                        ? 'text-[#1db954] bg-[#1db954]/10'
                        : 'text-[#888] bg-white/5'
                    }`}
                  >
                    {formattedGain} dB
                  </span>

                  {/* Fader vertical interactivo */}
                  <div className="relative h-44 w-8 flex items-center justify-center my-1">
                    {/* Guía central de 0 dB */}
                    <div className="absolute w-5 h-0.5 bg-white/20 z-0 pointer-events-none" />

                    {/* Barra de progreso de ganancia positiva / negativa */}
                    <div
                      className={`absolute w-1 rounded-full pointer-events-none transition-all ${
                        isEnabled ? 'bg-[#1db954]' : 'bg-[#555]'
                      }`}
                      style={{
                        top: currentGain >= 0 ? `${50 - (currentGain / 12) * 45}%` : '50%',
                        height: `${(Math.abs(currentGain) / 12) * 45}%`
                      }}
                    />

                    {/* Control input range orientado verticalmente */}
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="0.5"
                      value={band.gain}
                      disabled={!isEnabled}
                      onChange={(e) => setBandGain(index, parseFloat(e.target.value))}
                      onDoubleClick={() => setBandGain(index, 0)}
                      title={`Banda ${band.label}: ${formattedGain} dB (Doble clic para centrar a 0 dB)`}
                      className="harmonia-vertical-fader w-36 h-8 -rotate-90 appearance-none bg-transparent cursor-pointer disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Etiqueta de Frecuencia */}
                  <button
                    onClick={() => setBandGain(index, 0)}
                    disabled={!isEnabled}
                    title="Doble clic para restablecer esta banda a 0 dB"
                    className="text-center group-hover:scale-105 transition-transform"
                  >
                    <p className="text-xs font-bold text-white tracking-tight">{band.label}</p>
                    <p className="text-[10px] text-[#727272] uppercase font-medium capitalize mt-0.5">
                      {band.category}
                    </p>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-white/10 bg-black/40 flex items-center justify-between text-xs text-[#888]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#1db954] animate-pulse" />
            <span>Motor Web Audio API activo en tiempo real</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={resetToFlat}
              className="px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white font-medium transition-colors cursor-pointer"
            >
              Restablecer todo a 0 dB
            </button>
            <button
              onClick={closeModal}
              className="px-5 py-1.5 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Aceptar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
