import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { PlayerBar } from './components/PlayerBar';
import { QueueDrawer } from './components/QueueDrawer';
import { HomeView } from './components/Views/HomeView';
import { SearchView } from './components/Views/SearchView';
import { PlaylistView } from './components/Views/PlaylistView';
import { LyricsView } from './components/Views/LyricsView';
import { ArtistView } from './components/Views/ArtistView';
import { MiniPlayer } from './components/MiniPlayer';
import { SettingsModal } from './components/SettingsModal';
import { SoundCapsuleModal } from './components/SoundCapsuleModal';
import { BackgroundLayer } from './components/BackgroundLayer';
import { ThemeGalleryModal } from './components/ThemeGalleryModal';
import { CreatePlaylistModal } from './components/CreatePlaylistModal';
import { AddToPlaylistModal } from './components/AddToPlaylistModal';
import { NowPlayingSpotlight } from './components/NowPlayingSpotlight';
import { TrackContextMenu } from './components/TrackContextMenu';
import { EqualizerModal } from './components/EqualizerModal';
import { SleepTimerModal } from './components/SleepTimerModal';
import { useServerStore } from './stores/useServerStore';
import { usePlayerStore } from './stores/usePlayerStore';
import { useThemeStore } from './stores/useThemeStore';
import { useNavigation } from './hooks/useNavigation';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useMediaSession } from './hooks/useMediaSession';
import { useDiscordRpc } from './hooks/useDiscordRpc';
import { colorExtractor, ExtractedPalette } from './services/color/ColorExtractor';
import { Playlist, Track, ViewType } from './types';
import './App.css';

/**
 * Harmonia Desktop App
 * Coordina navegación, layout, fondo ambiental reactivo, estadísticas Wrapped y modales.
 */
export function App() {
  const { currentView, selectedPlaylistId, selectedArtistName, navigateTo, navigateBack } = useNavigation('home');
  const [previousViewBeforeLyrics, setPreviousViewBeforeLyrics] = useState<ViewType>('home');
  const [isMiniPlayerOpen, setIsMiniPlayerOpen] = useState(false);
  const [isSoundCapsuleOpen, setIsSoundCapsuleOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1200 : true;
  });
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [trackToAddToPlaylist, setTrackToAddToPlaylist] = useState<Track | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [ambientPalette, setAmbientPalette] = useState<ExtractedPalette | null>(null);
  const [isDynamicBackgroundEnabled, setIsDynamicBackgroundEnabled] = useState<boolean>(() => {
    return typeof localStorage !== 'undefined' ? localStorage.getItem('harmonia_dynamic_bg') !== 'false' : true;
  });

  const { provider, isConnected, activeMode, init } = useServerStore();
  const { currentTrack } = usePlayerStore();
  const { currentPresetId, openThemeGallery } = useThemeStore();

  // Modo Glassmorphism dinámico: Se activa con cualquier fondo animado/reactivo (y se desactiva en OLED minimal)
  const isGlassActive = currentPresetId !== 'oled-minimal';

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-glass', isGlassActive ? 'true' : 'false');
    }
  }, [isGlassActive]);

  // Extracción cromática en tiempo real de la portada de la canción actual (Estilo Spotify Vibrant)
  useEffect(() => {
    let isMounted = true;
    if (!currentTrack) return;

    colorExtractor
      .extractPalette(currentTrack.coverUrl, `${currentTrack.artist} ${currentTrack.title}`)
      .then((palette) => {
        if (isMounted) {
          setAmbientPalette(palette);
        }
      })
      .catch((err) => {
        console.warn('Error extracting color palette:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [currentTrack?.id, currentTrack?.coverUrl, currentTrack?.title, currentTrack?.artist]);

  const handleToggleDynamicBg = () => {
    setIsDynamicBackgroundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('harmonia_dynamic_bg', String(next));
      } catch (e) {
        console.warn('Failed saving dynamic bg preference:', e);
      }
      return next;
    });
  };

  // Activar atajos de teclado locales (Espacio, Flechas, M, L, N, P, S, R, E)
  useKeyboardShortcuts();

  // Activar integración nativa con Windows SMTC y teclas multimedia físicas
  useMediaSession();

  // Sincronización automática de estado con Discord Rich Presence (Discord RPC)
  useDiscordRpc();

  useEffect(() => {
    init();
  }, [init]);

  // Carga reactiva de playlists desde el proveedor actual (YouTube, Audius, Subsonic o Demo)
  useEffect(() => {
    let isMounted = true;

    async function loadCatalog() {
      try {
        const [serverPlaylists, serverAlbums] = await Promise.all([
          provider.getPlaylists().catch(() => []),
          provider.getAlbums ? provider.getAlbums('newest', 10).catch(() => []) : Promise.resolve([])
        ]);

        if (isMounted) {
          const combined = [...serverPlaylists, ...serverAlbums];
          setPlaylists(combined);
        }
      } catch (err) {
        console.warn('Error fetching playlists from provider:', err);
      }
    }

    loadCatalog();

    return () => {
      isMounted = false;
    };
  }, [provider, isConnected, activeMode]);

  const handlePlaylistCreated = (newPlaylist: Playlist) => {
    setPlaylists((prev) => [newPlaylist, ...prev]);
    navigateTo('playlist', newPlaylist.id);
  };

  return (
    <div
      data-glass={isGlassActive ? 'true' : 'false'}
      className="flex flex-col h-screen w-screen overflow-hidden bg-transparent text-white relative"
    >
      {/* Background Layer: Animaciones procedurales, videos en bucle y modo reactivo */}
      <BackgroundLayer ambientPalette={ambientPalette} />

      {/* Upper Content Area */}
      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* Spotify Sidebar */}
        <Sidebar
          currentView={currentView}
          selectedPlaylistId={selectedPlaylistId}
          playlists={playlists}
          onNavigate={navigateTo}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onCreatePlaylist={() => setIsCreatePlaylistOpen(true)}
          onOpenSoundCapsule={() => setIsSoundCapsuleOpen(true)}
          onOpenThemeGallery={openThemeGallery}
        />

        {/* Main Viewport con Fondo Reactivo y Glassmorphism Dinámico */}
        <main
          className={`flex-1 flex flex-col rounded-2xl m-2 ml-0 mr-1 overflow-hidden relative transition-all duration-500 ease-out harmonia-viewport ${
            currentView === 'lyrics' ? 'bg-transparent' : ''
          }`}
        >
          <Header
            currentView={currentView}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onBack={navigateBack}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenSoundCapsule={() => setIsSoundCapsuleOpen(true)}
            onOpenThemeGallery={openThemeGallery}
          />

          <div className="flex-1 overflow-y-auto">
            {currentView === 'home' && (
              <HomeView
                onSelectPlaylist={(id) => navigateTo('playlist', id)}
                onSelectArtist={(artist) => navigateTo('artist', artist)}
              />
            )}

            {currentView === 'search' && (
              <SearchView
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onAddToPlaylist={(track) => setTrackToAddToPlaylist(track)}
                onSelectArtist={(artist) => navigateTo('artist', artist)}
              />
            )}

            {currentView === 'playlist' && (
              <PlaylistView
                playlistId={selectedPlaylistId}
                onAddToPlaylist={(track) => setTrackToAddToPlaylist(track)}
                onSelectArtist={(artist) => navigateTo('artist', artist)}
              />
            )}

            {currentView === 'liked' && (
              <PlaylistView
                playlistId={null}
                isLikedView={true}
                onAddToPlaylist={(track) => setTrackToAddToPlaylist(track)}
                onSelectArtist={(artist) => navigateTo('artist', artist)}
              />
            )}

            {currentView === 'artist' && (
              <ArtistView
                artistName={selectedArtistName || currentTrack?.artist || 'Post Malone'}
                onSelectArtist={(artist) => navigateTo('artist', artist)}
                onAddToPlaylist={(track) => setTrackToAddToPlaylist(track)}
              />
            )}

            {currentView === 'lyrics' && (
              <LyricsView />
            )}
          </div>
        </main>

        {/* Columna 3: NowPlayingSpotlight (Concepto Apple Music Glassmorphism) */}
        {currentView !== 'lyrics' && (
          <NowPlayingSpotlight
            isOpen={isSpotlightOpen}
            onClose={() => setIsSpotlightOpen(false)}
            onNavigateToLyrics={() => {
              setPreviousViewBeforeLyrics(currentView);
              navigateTo('lyrics');
            }}
            onNavigateToArtist={(artist) => navigateTo('artist', artist)}
            onAddToPlaylist={(track) => setTrackToAddToPlaylist(track)}
          />
        )}

        {/* Queue Drawer (Side Panel) */}
        <QueueDrawer
          isOpen={isQueueOpen}
          onClose={() => setIsQueueOpen(false)}
        />
      </div>

      {/* Persistent Bottom Streaming Player */}
      <PlayerBar
        isQueueOpen={isQueueOpen}
        onToggleQueue={() => setIsQueueOpen(!isQueueOpen)}
        isLyricsActive={currentView === 'lyrics'}
        onToggleLyrics={() => {
          if (currentView === 'lyrics') {
            navigateTo(previousViewBeforeLyrics);
          } else {
            setPreviousViewBeforeLyrics(currentView);
            navigateTo('lyrics');
          }
        }}
        onNavigateToArtist={(artist) => navigateTo('artist', artist)}
        isMiniPlayerOpen={isMiniPlayerOpen}
        onToggleMiniPlayer={() => setIsMiniPlayerOpen(!isMiniPlayerOpen)}
        isSpotlightOpen={isSpotlightOpen}
        onToggleSpotlight={() => setIsSpotlightOpen(!isSpotlightOpen)}
      />

      {/* Floating Picture-in-Picture Mini-Player */}
      <MiniPlayer
        isOpen={isMiniPlayerOpen}
        onClose={() => setIsMiniPlayerOpen(false)}
        onExpand={() => setIsMiniPlayerOpen(false)}
      />

      {/* Settings / Server Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isDynamicBgEnabled={isDynamicBackgroundEnabled}
        onToggleDynamicBg={handleToggleDynamicBg}
        onOpenSoundCapsule={() => setIsSoundCapsuleOpen(true)}
        onOpenThemeGallery={openThemeGallery}
      />

      {/* Spicetify-like Themes & Backgrounds Gallery Modal */}
      <ThemeGalleryModal />

      {/* Harmonia Wrapped / Sound Capsule Modal */}
      <SoundCapsuleModal
        isOpen={isSoundCapsuleOpen}
        onClose={() => setIsSoundCapsuleOpen(false)}
      />

      {/* Create Playlist Modal */}
      <CreatePlaylistModal
        isOpen={isCreatePlaylistOpen}
        onClose={() => setIsCreatePlaylistOpen(false)}
        onPlaylistCreated={handlePlaylistCreated}
      />

      {/* Add To Playlist Modal */}
      <AddToPlaylistModal
        isOpen={!!trackToAddToPlaylist}
        track={trackToAddToPlaylist}
        playlists={playlists}
        onClose={() => setTrackToAddToPlaylist(null)}
      />

      {/* Global Track Context Menu (Clic Derecho Glassmorphism) */}
      <TrackContextMenu
        onNavigateToArtist={(artist) => navigateTo('artist', artist)}
        onNavigateToLyrics={() => {
          setPreviousViewBeforeLyrics(currentView);
          navigateTo('lyrics');
        }}
        onAddToPlaylist={(track) => setTrackToAddToPlaylist(track)}
      />

      {/* Multiband Graphic Audio Equalizer Modal (REA Spotify Desktop) */}
      <EqualizerModal />

      {/* Sleep Timer Modal (Temporizador de Apagado) */}
      <SleepTimerModal />
    </div>
  );
}

export default App;
