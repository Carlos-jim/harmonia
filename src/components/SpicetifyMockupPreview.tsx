import React, { useState } from 'react';
import { Play, Image as ImageIcon, Layout } from 'lucide-react';
import { SpicetifyTheme, SpicetifyColorScheme } from '../services/theme/SpicetifyThemeEngine';

interface SpicetifyMockupPreviewProps {
  theme: SpicetifyTheme;
  activeScheme: SpicetifyColorScheme;
}

export const SpicetifyMockupPreview: React.FC<SpicetifyMockupPreviewProps> = ({
  theme,
  activeScheme
}) => {
  const [viewMode, setViewMode] = useState<'mockup' | 'screenshot'>('mockup');
  const [imageError, setImageError] = useState(false);

  const c = activeScheme.colors;
  const hasScreenshot = Boolean(theme.previewUrl) && !imageError;

  return (
    <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden border border-white/10 shadow-lg group select-none bg-black/60">
      {/* 1. MODO CAPTURA REAL DE GITHUB (Si está disponible y seleccionado) */}
      {viewMode === 'screenshot' && hasScreenshot ? (
        <div className="relative w-full h-full">
          <img
            src={theme.previewUrl}
            alt={theme.name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
        </div>
      ) : (
        /* 2. MODO MINIATURA UI INTERACTIVA EN TIEMPO REAL */
        <div
          className="relative w-full h-full flex flex-col font-sans transition-colors duration-300"
          style={{ backgroundColor: c.main }}
        >
          {/* Header con Traffic Lights */}
          <div
            className="h-4 px-2 flex items-center justify-between border-b"
            style={{
              backgroundColor: c.sidebar,
              borderColor: `${c.misc}33`
            }}
          >
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff5f56]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#ffbd2e]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#27c93f]" />
            </div>
            <span
              className="text-[8px] font-bold tracking-tight truncate max-w-[120px]"
              style={{ color: c.subtext }}
            >
              {theme.name} · {activeScheme.name}
            </span>
            <div className="w-6" />
          </div>

          {/* Centro: Sidebar + Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Mini Sidebar */}
            <div
              className="w-12 p-1.5 flex flex-col gap-1 border-r"
              style={{
                backgroundColor: c.sidebar,
                borderColor: `${c.misc}33`
              }}
            >
              <div
                className="w-full h-2 rounded flex items-center px-1"
                style={{ backgroundColor: `${c.button}25` }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: c.button }}
                />
              </div>
              <div
                className="w-full h-1.5 rounded opacity-40"
                style={{ backgroundColor: c.subtext }}
              />
              <div
                className="w-3/4 h-1.5 rounded opacity-30 mt-auto"
                style={{ backgroundColor: c.subtext }}
              />
            </div>

            {/* Mini Main Area */}
            <div className="flex-1 p-2 flex flex-col gap-1.5 relative overflow-hidden">
              {/* Subtle ambient aura */}
              <div
                className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-xl opacity-30 pointer-events-none"
                style={{ backgroundColor: c.button }}
              />

              <div className="flex items-center justify-between">
                <div
                  className="w-16 h-2 rounded font-extrabold text-[8px] truncate"
                  style={{ color: c.text }}
                >
                  Buenas tardes
                </div>
                <div
                  className="px-1 py-0.2 rounded text-[7px] font-bold"
                  style={{
                    backgroundColor: `${c.button}33`,
                    color: c.button
                  }}
                >
                  {activeScheme.name}
                </div>
              </div>

              {/* Mini Cards Grid */}
              <div className="grid grid-cols-3 gap-1.5 flex-1 items-center">
                {[1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className="h-full rounded-md p-1 flex flex-col justify-between border"
                    style={{
                      backgroundColor: c.card,
                      borderColor: `${c.misc}40`
                    }}
                  >
                    <div
                      className="w-full aspect-square rounded-sm"
                      style={{
                        background: `linear-gradient(135deg, ${c.button}66, ${c.card})`
                      }}
                    />
                    <div
                      className="w-full h-1 rounded mt-1"
                      style={{ backgroundColor: `${c.text}88` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mini Player Bar */}
          <div
            className="h-5 px-2 flex items-center justify-between border-t"
            style={{
              backgroundColor: c.player,
              borderColor: `${c.misc}33`
            }}
          >
            <div className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: `${c.button}88` }}
              />
              <div
                className="w-8 h-1 rounded"
                style={{ backgroundColor: `${c.text}aa` }}
              />
            </div>

            {/* Play Button */}
            <div
              className="w-3.5 h-3.5 rounded-full flex items-center justify-center shadow"
              style={{
                backgroundColor: c.button,
                color: c.main
              }}
            >
              <Play className="w-2 h-2 fill-current ml-0.2" />
            </div>

            {/* Progress bar */}
            <div
              className="w-10 h-1 rounded-full overflow-hidden"
              style={{ backgroundColor: `${c.subtext}44` }}
            >
              <div
                className="w-3/5 h-full rounded-full"
                style={{ backgroundColor: c.button }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Switcher de Vista: Miniatura UI vs Captura Real */}
      {hasScreenshot && (
        <div className="absolute top-1.5 right-1.5 z-10 flex items-center gap-1 bg-black/60 backdrop-blur-md rounded-lg p-0.5 border border-white/10 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setViewMode('mockup');
            }}
            className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 transition-all ${
              viewMode === 'mockup'
                ? 'bg-white text-black shadow-sm'
                : 'text-white/70 hover:text-white'
            }`}
            title="Ver Miniatura Interactiva en vivo"
          >
            <Layout className="w-2.5 h-2.5" />
            <span>UI</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setViewMode('screenshot');
            }}
            className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 transition-all ${
              viewMode === 'screenshot'
                ? 'bg-white text-black shadow-sm'
                : 'text-white/70 hover:text-white'
            }`}
            title="Ver Captura Real del tema en Spotify"
          >
            <ImageIcon className="w-2.5 h-2.5" />
            <span>Foto</span>
          </button>
        </div>
      )}
    </div>
  );
};
