import React from 'react';
import { ChevronLeft, ChevronRight, Search, Palette, Crown, Settings } from 'lucide-react';
import { ViewType } from '../types';

interface HeaderProps {
  currentView: ViewType;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onBack: () => void;
  onOpenSettings: () => void;
  onOpenSoundCapsule?: () => void;
  onOpenThemeGallery?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  searchQuery,
  onSearchChange,
  onBack,
  onOpenSettings,
  onOpenSoundCapsule,
  onOpenThemeGallery
}) => {

  return (
    <header className="h-16 harmonia-header sticky top-0 z-30 flex items-center justify-between px-6 transition-colors">
      {/* Navigation Arrows */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          title="Atrás"
          className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 flex items-center justify-center text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          disabled
          title="Adelante"
          className="w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-[#727272] cursor-not-allowed"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Search bar inside header when search view is open */}
        {currentView === 'search' && (
          <div className="relative ml-4 w-72 md:w-96">
            <Search className="w-4 h-4 text-[#727272] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="¿Qué quieres escuchar hoy?"
              className="w-full bg-[#242424] text-white text-sm rounded-full pl-9 pr-4 py-2 outline-none border border-transparent focus:border-white/20 transition-all placeholder:text-[#727272]"
              autoFocus
            />
          </div>
        )}
      </div>

      {/* Right Controls: Sound Capsule & Server Connection */}
      <div className="flex items-center gap-3">
        {onOpenThemeGallery && (
          <button
            onClick={onOpenThemeGallery}
            style={{
              background: 'linear-gradient(to right, color-mix(in srgb, var(--spice-button, #1db954) 22%, transparent), color-mix(in srgb, var(--spice-button, #1db954) 10%, transparent))',
              borderColor: 'color-mix(in srgb, var(--spice-button, #1db954) 40%, transparent)'
            }}
            className="flex items-center gap-1.5 hover:opacity-90 text-white text-xs font-semibold px-3 py-1.5 rounded-full border transition-all shadow-sm cursor-pointer hover:scale-105 active:scale-95"
            title="Galería de Temas y Fondos Animados"
          >
            <Palette className="w-3.5 h-3.5" style={{ color: 'var(--spice-button, #1db954)' }} />
            <span className="hidden md:inline">Temas</span>
          </button>
        )}

        {onOpenSoundCapsule && (
          <button
            onClick={onOpenSoundCapsule}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 to-white/5 hover:from-amber-500/30 hover:to-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-amber-300/30 hover:border-amber-300/50 transition-all shadow-sm cursor-pointer hover:scale-105 active:scale-95"
            title="Abrir Cápsula de Sonido (Harmonia Wrapped)"
          >
            <Crown className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">Cápsula de Sonido</span>
          </button>
        )}

        <button
          onClick={onOpenSettings}
          className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-[#b3b3b3] hover:text-white flex items-center justify-center transition-all cursor-pointer border border-white/10 shadow-sm"
          title="Configuración"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
