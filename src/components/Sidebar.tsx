import React from 'react';
import { Home, Search, Library, Plus, Heart, Music2, Palette } from 'lucide-react';
import { ViewType, Playlist } from '../types';
import { SAMPLE_PLAYLISTS } from '../data/mockData';

interface SidebarProps {
  currentView: ViewType;
  selectedPlaylistId: string | null;
  playlists?: Playlist[];
  onNavigate: (view: ViewType, playlistId?: string) => void;
  onOpenSettings: () => void;
  onCreatePlaylist: () => void;
  onOpenSoundCapsule?: () => void;
  onOpenThemeGallery?: () => void;
}

/**
 * Sidebar:
 * Barra lateral ultra-moderna inspirada en el concepto Glassmorphic de Apple Music.
 * Presenta navegación limpia con indicadores verticales de acento neón y tarjetas de biblioteca con diseño de lujo.
 */
export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  selectedPlaylistId,
  playlists = SAMPLE_PLAYLISTS,
  onNavigate,
  onCreatePlaylist,
  onOpenThemeGallery
}) => {

  return (
    <aside className="w-68 harmonia-sidebar flex flex-col gap-2 p-2.5 select-none shrink-0 h-full border-r border-white/5 transition-all">
      {/* 1. Top Section: Window Controls & Navigation Box */}
      <div className="harmonia-sidebar-box rounded-2xl p-4 flex flex-col gap-4 shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
        {/* macOS Traffic Light Window Controls */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56] border border-black/20 hover:opacity-80 cursor-pointer shadow-sm transition-opacity" />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-black/20 hover:opacity-80 cursor-pointer shadow-sm transition-opacity" />
            <span className="w-3 h-3 rounded-full bg-[#27c93f] border border-black/20 hover:opacity-80 cursor-pointer shadow-sm transition-opacity" />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-black tracking-widest bg-white/10 text-white/90 px-2 py-0.5 rounded-full border border-white/15 backdrop-blur-md">
              v2.4 Pro
            </span>
          </div>
        </div>

        {/* Harmonia Brand Title con Glow */}
        <div className="flex items-center gap-2.5 px-1">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md transition-all"
            style={{
              backgroundColor: 'var(--spice-button, #1db954)',
              color: 'var(--spice-main, #000000)',
              boxShadow: '0 0 15px color-mix(in srgb, var(--spice-button, #1db954) 40%, transparent)'
            }}
          >
            <Music2 className="w-4.5 h-4.5 fill-current" />
          </div>
          <span className="text-white font-extrabold text-xl tracking-tight">Harmonia</span>
        </div>

        {/* Main Navigation (Inspirado en Imagen 2 - Apple Music con indicador vertical izquierdo) */}
        <nav className="flex flex-col gap-1 mt-1">
          <button
            onClick={() => onNavigate('home')}
            className={`relative flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
              currentView === 'home'
                ? 'bg-white/15 text-white shadow-md backdrop-blur-md border border-white/15'
                : 'text-[#b3b3b3] hover:text-white hover:bg-white/5'
            }`}
          >
            {/* Indicador Neón Vertical estilo Apple Music (Imagen 2) */}
            {currentView === 'home' && (
              <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#1db954] rounded-r-full shadow-[0_0_10px_#1db954]" />
            )}
            <Home className={`w-5 h-5 transition-colors ${currentView === 'home' ? 'text-[#1db954]' : ''}`} />
            <span>Inicio</span>
          </button>

          <button
            onClick={() => onNavigate('search')}
            className={`relative flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
              currentView === 'search'
                ? 'bg-white/15 text-white shadow-md backdrop-blur-md border border-white/15'
                : 'text-[#b3b3b3] hover:text-white hover:bg-white/5'
            }`}
          >
            {currentView === 'search' && (
              <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#1db954] rounded-r-full shadow-[0_0_10px_#1db954]" />
            )}
            <Search className={`w-5 h-5 transition-colors ${currentView === 'search' ? 'text-[#1db954]' : ''}`} />
            <span>Buscar</span>
          </button>

          {onOpenThemeGallery && (
            <button
              onClick={onOpenThemeGallery}
              className="relative flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-medium text-sm text-[#b3b3b3] hover:text-white hover:bg-white/5 transition-all cursor-pointer group"
              title="Personalizar temas y fondos (Spicetify Mode)"
            >
              <Palette className="w-5 h-5 text-purple-400 group-hover:rotate-12 transition-transform" />
              <span>Temas & Fondos</span>
            </button>
          )}
        </nav>
      </div>

      {/* 2. Library Box: Tu Biblioteca con estética de lujo */}
      <div className="harmonia-sidebar-box rounded-2xl p-3.5 flex-1 flex flex-col overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
        {/* Header Biblioteca */}
        <div className="flex items-center justify-between px-2 py-1.5 text-[#b3b3b3] transition-colors">
          <div className="flex items-center gap-2.5">
            <Library className="w-5 h-5 text-white/90" />
            <span className="font-extrabold text-sm tracking-tight text-white">Tu biblioteca</span>
          </div>
          <button
            onClick={onCreatePlaylist}
            title="Crear nueva lista"
            className="w-7 h-7 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-[#b3b3b3] hover:text-white border border-transparent hover:border-white/10"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Tarjetas Especiales: Canciones Favoritas */}
        <div className="mt-2.5 flex flex-col gap-2 overflow-y-auto pr-1 flex-1">

          {/* Tarjeta Canciones que te gustan */}
          <button
            onClick={() => onNavigate('liked')}
            className={`relative flex items-center gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
              currentView === 'liked'
                ? 'bg-white/15 text-white border border-white/20 shadow-md backdrop-blur-md'
                : 'hover:bg-white/5 text-[#b3b3b3] hover:text-white border border-transparent hover:border-white/5'
            }`}
          >
            {currentView === 'liked' && (
              <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#1db954] rounded-r-full shadow-[0_0_10px_#1db954]" />
            )}
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-700 to-emerald-400 flex items-center justify-center shrink-0 shadow-md">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-white text-xs font-bold truncate">Canciones que te gustan</p>
              <p className="text-[#b3b3b3] text-[11px] truncate mt-0.5">Colección favorita</p>
            </div>
          </button>

          {/* Playlists & Álbumes List (Estilo Apple Music con indicador activo) */}
          <div className="border-t border-white/10 my-2 pt-2.5 flex flex-col gap-1">
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-[10px] font-black text-[#727272] uppercase tracking-wider">
                Playlists & Álbumes
              </span>
              <span className="text-[10px] font-mono text-[#727272]">
                {playlists.length}
              </span>
            </div>

            {playlists.map((playlist: Playlist) => {
              const isActive = currentView === 'playlist' && selectedPlaylistId === playlist.id;
              return (
                <button
                  key={playlist.id}
                  onClick={() => onNavigate('playlist', playlist.id)}
                  className={`relative flex items-center gap-3 p-2 rounded-xl text-left transition-all cursor-pointer group ${
                    isActive
                      ? 'bg-white/15 text-white border border-white/15 shadow-sm backdrop-blur-md'
                      : 'hover:bg-white/5 text-[#b3b3b3] hover:text-white border border-transparent'
                  }`}
                >
                  {/* Indicador Apple Music cuando la playlist está activa */}
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#1db954] rounded-r-full shadow-[0_0_8px_#1db954]" />
                  )}

                  <img
                    src={playlist.coverUrl}
                    alt={playlist.title}
                    className="w-10 h-10 rounded-xl object-cover shrink-0 shadow-md border border-white/10 group-hover:scale-105 transition-transform"
                  />

                  <div className="overflow-hidden flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate ${isActive ? 'text-[#1db954]' : 'text-white'}`}>
                      {playlist.title}
                    </p>
                    <p className="text-[#727272] text-[10px] truncate mt-0.5">
                      {playlist.tracks ? `${playlist.tracks.length} temas` : playlist.description}
                    </p>
                  </div>

                  {/* Dot activo a la derecha estilo Imagen 2 */}
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-[#1db954] shadow-[0_0_8px_#1db954] shrink-0 ml-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
};
