import React, { useState } from 'react';
import { X, Server, Globe, PlayCircle, CheckCircle2, AlertCircle, Terminal, Check, Music2, Sliders, Volume2, Palette, Crown, SlidersHorizontal, Moon, MessageSquare } from 'lucide-react';
import { useServerStore, ProviderMode } from '../stores/useServerStore';
import { usePlayerStore } from '../stores/usePlayerStore';
import { useEqualizerStore } from '../stores/useEqualizerStore';
import { useSleepTimerStore } from '../stores/useSleepTimerStore';
import { useDiscordStore } from '../stores/useDiscordStore';
import { formatTime } from '../utils/formatTime';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDynamicBgEnabled?: boolean;
  onToggleDynamicBg?: () => void;
  onOpenSoundCapsule?: () => void;
  onOpenThemeGallery?: () => void;
}

type SettingsTab = ProviderMode | 'playback';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isDynamicBgEnabled = true,
  onToggleDynamicBg,
  onOpenSoundCapsule,
  onOpenThemeGallery
}) => {
  const {
    serverUrl,
    username,
    password,
    isConnected,
    isConnecting,
    connectionError,
    activeMode,
    connectSubsonic,
    disconnect,
    enableYouTubeMode,
    enableAudiusMode,
    enableDemoMode
  } = useServerStore();

  const {
    crossfadeDuration,
    isCrossfadeEnabled,
    setCrossfadeDuration,
    toggleCrossfade
  } = usePlayerStore();

  const {
    isEnabled: isEqEnabled,
    activePresetId,
    presets: eqPresets,
    toggleEnabled: toggleEqEnabled,
    openModal: openEqModal
  } = useEqualizerStore();

  const activePreset = eqPresets.find((p) => p.id === activePresetId);

  const {
    isActive: isSleepActive,
    remainingSeconds: sleepRemaining,
    mode: sleepMode,
    openModal: openSleepModal,
    cancelTimer: cancelSleepTimer
  } = useSleepTimerStore();

  const {
    isEnabled: isDiscordEnabled,
    isConnected: isDiscordConnected,
    toggleEnabled: toggleDiscord
  } = useDiscordStore();

  const [selectedTab, setSelectedTab] = useState<SettingsTab>(activeMode);
  const [inputUrl, setInputUrl] = useState(serverUrl || 'http://localhost:4533');
  const [inputUser, setInputUser] = useState(username || 'admin');
  const [inputPass, setInputPass] = useState(password || '');
  const [showDockerHelp, setShowDockerHelp] = useState(false);

  if (!isOpen) return null;

  const handleConnectSubsonic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl || !inputUser) return;

    const ok = await connectSubsonic({
      serverUrl: inputUrl,
      username: inputUser,
      password: inputPass
    });

    if (ok) {
      setTimeout(() => onClose(), 500);
    }
  };

  const handleActivateYouTube = () => {
    enableYouTubeMode();
    setSelectedTab('youtube');
    setTimeout(() => onClose(), 300);
  };

  const handleActivateAudius = () => {
    enableAudiusMode();
    setSelectedTab('audius');
    setTimeout(() => onClose(), 300);
  };

  const handleActivateDemo = () => {
    enableDemoMode();
    setSelectedTab('demo');
    setTimeout(() => onClose(), 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="harmonia-modal-glass rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#282828] flex items-center justify-center">
              {activeMode === 'youtube' ? (
                <Music2 className="w-6 h-6 text-red-500" />
              ) : activeMode === 'audius' ? (
                <Globe className="w-6 h-6 text-emerald-400" />
              ) : (
                <Server className="w-6 h-6 text-[#1db954]" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Fuente de Música y Streaming</h2>
              <p className="text-xs text-[#b3b3b3]">
                Elige de dónde quieres reproducir tu música
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#b3b3b3] hover:text-white p-1 rounded-full hover:bg-[#282828] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-[#282828] bg-[#121212] px-6 pt-3 gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedTab('youtube')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              selectedTab === 'youtube'
                ? 'border-red-500 text-white'
                : 'border-transparent text-[#a0a0a0] hover:text-white'
            }`}
          >
            <Music2 className="w-3.5 h-3.5 text-red-500" />
            <span>YouTube Music</span>
            {activeMode === 'youtube' && (
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            )}
          </button>

          <button
            onClick={() => setSelectedTab('audius')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              selectedTab === 'audius'
                ? 'border-emerald-400 text-white'
                : 'border-transparent text-[#a0a0a0] hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>Audius</span>
            {activeMode === 'audius' && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            )}
          </button>

          <button
            onClick={() => setSelectedTab('subsonic')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              selectedTab === 'subsonic'
                ? 'border-[#1db954] text-white'
                : 'border-transparent text-[#a0a0a0] hover:text-white'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-[#1db954]" />
            <span>Navidrome</span>
            {activeMode === 'subsonic' && isConnected && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#1db954]" />
            )}
          </button>

          <button
            onClick={() => setSelectedTab('demo')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              selectedTab === 'demo'
                ? 'border-amber-400 text-white'
                : 'border-transparent text-[#a0a0a0] hover:text-white'
            }`}
          >
            <PlayCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Demo</span>
            {activeMode === 'demo' && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            )}
          </button>

          <button
            onClick={() => setSelectedTab('playback')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              selectedTab === 'playback'
                ? 'border-[#1db954] text-white'
                : 'border-transparent text-[#a0a0a0] hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-[#1db954]" />
            <span>Audio & DJ Crossfade</span>
            {isCrossfadeEnabled && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#1db954]" />
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 flex flex-col gap-5">
          {/* TAB 1: YOUTUBE MUSIC (OFICIAL) */}
          {selectedTab === 'youtube' && (
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                <Music2 className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-white text-sm">Grabaciones Oficiales de Estudio (YouTube Music)</p>
                  <p className="text-white/80 mt-1 leading-relaxed">
                    Conexión directa con los lanzamientos oficiales de discográficas. Reproduce los audios originales de estudio de cualquier artista (Yan Block, Omar Courtz, etc.) sin edits ni versiones alteradas.
                  </p>
                  <div className="mt-2.5 flex items-center gap-2 text-[11px] text-red-300">
                    <Check className="w-3.5 h-3.5" />
                    <span>Audios originales de estudio • Catálogo discográfico oficial • $0 costo</span>
                  </div>
                </div>
              </div>

              {activeMode === 'youtube' ? (
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#121212] border border-[#282828]">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="text-xs font-bold text-white">Catálogo de YouTube Music Activo</p>
                      <p className="text-[11px] text-[#b3b3b3]">Búsqueda y reproducción de pistas originales habilitada</p>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleActivateYouTube}
                  className="w-full bg-red-600 hover:bg-red-500 text-white font-bold text-sm py-2.5 rounded-full transition-transform active:scale-95 shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Music2 className="w-4 h-4" />
                  Activar Grabaciones Oficiales de YouTube
                </button>
              )}
            </div>
          )}

          {/* TAB 2: AUDIUS */}
          {selectedTab === 'audius' && (
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
                <Globe className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-white text-sm">Catálogo Público Descentralizado (Audius)</p>
                  <p className="text-white/80 mt-1 leading-relaxed">
                    Red pública abierta para artistas independientes, productores, sets de DJs y pistas libres de licencias.
                  </p>
                </div>
              </div>

              {activeMode === 'audius' ? (
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#121212] border border-[#282828]">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <div>
                      <p className="text-xs font-bold text-white">Audius Activo</p>
                      <p className="text-[11px] text-[#b3b3b3]">Reproduciendo desde la red abierta de Audius</p>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleActivateAudius}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm py-2.5 rounded-full transition-transform active:scale-95 shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Globe className="w-4 h-4" />
                  Activar Catálogo Audius
                </button>
              )}
            </div>
          )}

          {/* TAB 3: SUBSONIC / NAVIDROME */}
          {selectedTab === 'subsonic' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#121212] border border-[#282828]">
                <div className="flex items-center gap-2.5">
                  {isConnected && activeMode === 'subsonic' ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-[#1db954]" />
                      <div>
                        <p className="text-xs font-bold text-white">Conectado a Servidor Navidrome</p>
                        <p className="text-[11px] text-[#b3b3b3] truncate max-w-[280px]">{serverUrl}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-amber-400" />
                      <div>
                        <p className="text-xs font-bold text-white">Servidor no conectado</p>
                        <p className="text-[11px] text-[#b3b3b3]">Ingresa la URL y credenciales de tu Navidrome</p>
                      </div>
                    </>
                  )}
                </div>

                {isConnected && activeMode === 'subsonic' && (
                  <button
                    onClick={disconnect}
                    className="text-xs text-rose-400 hover:text-rose-300 font-medium px-3 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 transition-colors"
                  >
                    Desconectar
                  </button>
                )}
              </div>

              <form onSubmit={handleConnectSubsonic} className="flex flex-col gap-3.5">
                <div>
                  <label className="text-xs font-bold text-[#b3b3b3] uppercase tracking-wider block mb-1">
                    URL del Servidor
                  </label>
                  <input
                    type="text"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="http://localhost:4533"
                    className="w-full bg-[#121212] border border-[#333] focus:border-[#1db954] text-white text-sm rounded-md px-3.5 py-2 outline-none transition-colors"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#b3b3b3] uppercase tracking-wider block mb-1">
                      Usuario
                    </label>
                    <input
                      type="text"
                      value={inputUser}
                      onChange={(e) => setInputUser(e.target.value)}
                      placeholder="admin"
                      className="w-full bg-[#121212] border border-[#333] focus:border-[#1db954] text-white text-sm rounded-md px-3.5 py-2 outline-none transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#b3b3b3] uppercase tracking-wider block mb-1">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      value={inputPass}
                      onChange={(e) => setInputPass(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#121212] border border-[#333] focus:border-[#1db954] text-white text-sm rounded-md px-3.5 py-2 outline-none transition-colors"
                    />
                  </div>
                </div>

                {connectionError && (
                  <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{connectionError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isConnecting}
                  className="mt-1 bg-[#1db954] hover:bg-[#1ed760] disabled:bg-[#1db954]/50 text-black font-bold text-sm py-2.5 rounded-full transition-transform active:scale-95 shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isConnecting ? 'Conectando...' : 'Conectar Servidor Navidrome'}
                </button>
              </form>

              <div className="border-t border-[#282828] pt-2">
                <button
                  onClick={() => setShowDockerHelp(!showDockerHelp)}
                  className="text-xs text-[#b3b3b3] hover:text-[#1db954] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>¿Cómo levantar Navidrome con Docker en 1 minuto?</span>
                </button>

                {showDockerHelp && (
                  <div className="mt-2.5 p-3 bg-[#101010] rounded border border-[#282828] text-xs font-mono text-[#b3b3b3] overflow-x-auto">
                    <p className="text-white/60 mb-1"># Ejecuta esto en tu terminal:</p>
                    <p className="text-[#1db954]">cd docker; docker compose up -d</p>
                    <p className="text-white/60 mt-2 mb-1"># Luego abre:</p>
                    <p className="text-sky-400">http://localhost:4533</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: DEMO */}
          {selectedTab === 'demo' && (
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                <PlayCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-white text-sm">Modo Demo Local (Offline)</p>
                  <p className="text-white/80 mt-1 leading-relaxed">
                    6 canciones de muestra preinstaladas localmente para probar sin conexión a internet.
                  </p>
                </div>
              </div>

              {activeMode === 'demo' ? (
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#121212] border border-[#282828]">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-amber-400" />
                    <div>
                      <p className="text-xs font-bold text-white">Modo Demo Activo</p>
                      <p className="text-[11px] text-[#b3b3b3]">6 pistas de prueba disponibles</p>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleActivateDemo}
                  className="w-full bg-amber-400 hover:bg-amber-300 text-black font-bold text-sm py-2.5 rounded-full transition-transform active:scale-95 shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <PlayCircle className="w-4 h-4" />
                  Activar Modo Demo Local
                </button>
              )}
            </div>
          )}

          {/* TAB 5: AUDIO & CROSSFADE DJ */}
          {selectedTab === 'playback' && (
            <div className="flex flex-col gap-5">
              <div className="p-4 rounded-lg bg-[#1db954]/10 border border-[#1db954]/30 flex items-start gap-3">
                <Sliders className="w-5 h-5 text-[#1db954] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-white text-sm">Crossfade DJ & Gapless Playback</p>
                  <p className="text-white/80 mt-1 leading-relaxed">
                    Tecnología de doble canal inspirada en Spotify Desktop. Elimina los silencios incómodos entre canciones mediante fundido cruzado con curva de potencia constante (Equal-Power Curve).
                  </p>
                </div>
              </div>

              {/* Crossfade switch */}
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#121212] border border-[#282828]">
                <div>
                  <p className="text-sm font-bold text-white">Activar Crossfade</p>
                  <p className="text-xs text-[#b3b3b3]">
                    {isCrossfadeEnabled
                      ? `Fundido continuo de ${crossfadeDuration} segundos entre canciones`
                      : 'Reproducción estándar con corte al final'}
                  </p>
                </div>
                <button
                  onClick={toggleCrossfade}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    isCrossfadeEnabled ? 'bg-[#1db954]' : 'bg-[#3e3e3e]'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      isCrossfadeEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Crossfade slider */}
              {isCrossfadeEnabled && (
                <div className="p-4 rounded-lg bg-[#121212] border border-[#282828] flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#b3b3b3] uppercase tracking-wider">
                      Duración del Fundido
                    </span>
                    <span className="text-sm font-mono font-bold text-[#1db954]">
                      {crossfadeDuration} segundos
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={12}
                    value={crossfadeDuration}
                    onChange={(e) => setCrossfadeDuration(Number(e.target.value))}
                    className="w-full h-1.5 bg-[#333] rounded-lg appearance-none cursor-pointer accent-[#1db954] hover:accent-[#1ed760]"
                  />
                  <div className="flex justify-between text-[10px] text-[#727272] font-mono">
                    <span>1s (Sutil)</span>
                    <span>4s (Spotify Estándar)</span>
                    <span>8s (Estilo Club)</span>
                    <span>12s (Max DJ)</span>
                  </div>
                </div>
              )}

              {/* Micro Fades info */}
              <div className="p-3 rounded-lg bg-[#141414] border border-white/5 flex items-center gap-2.5 text-xs text-[#b3b3b3]">
                <Volume2 className="w-4 h-4 text-[#1db954] shrink-0" />
                <span>
                  Anti-Pop Protection activa: micro-fades de 150ms al pausar o cambiar de pista para proteger tus altavoces y auriculares.
                </span>
              </div>

              {/* Graphic Audio Equalizer Section */}
              <div className="p-4 rounded-lg bg-[#121212] border border-[#282828] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <SlidersHorizontal className="w-5 h-5 text-[#1db954]" />
                    <div>
                      <p className="text-sm font-bold text-white">Ecualizador Gráfico (EQ)</p>
                      <p className="text-xs text-[#b3b3b3]">
                        {isEqEnabled
                          ? `Activo - Preajuste: ${activePreset?.name || 'Personalizado'}`
                          : 'Desactivado (Bypass)'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={toggleEqEnabled}
                    className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      isEqEnabled ? 'bg-[#1db954]' : 'bg-[#3e3e3e]'
                    }`}
                    title={isEqEnabled ? 'Desactivar ecualizador' : 'Activar ecualizador'}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        isEqEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-xs text-[#888]">Ajuste de 6 bandas (-12 dB a +12 dB) con Web Audio API</span>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      openEqModal();
                    }}
                    className="px-3.5 py-1.5 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black font-bold text-xs transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Abrir Ecualizador</span>
                  </button>
                </div>
              </div>

              {/* Discord Rich Presence (RPC) Section */}
              <div className="p-4 rounded-lg bg-[#121212] border border-[#282828] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <MessageSquare className="w-5 h-5 text-indigo-400" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-white">Discord Rich Presence (RPC)</p>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isDiscordConnected ? 'bg-[#1db954] animate-pulse' : 'bg-[#555]'
                          }`}
                        />
                      </div>
                      <p className="text-xs text-[#b3b3b3]">
                        {isDiscordEnabled
                          ? isDiscordConnected
                            ? 'Conectado a Discord - Mostrando canción actual'
                            : 'Activo - Esperando que abras Discord'
                          : 'Desactivado'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={toggleDiscord}
                    className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      isDiscordEnabled ? 'bg-indigo-500' : 'bg-[#3e3e3e]'
                    }`}
                    title={isDiscordEnabled ? 'Desactivar Discord RPC' : 'Activar Discord RPC'}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        isDiscordEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-[#888]">
                  <span>Muestra en tu perfil de Discord la pista, artista y portada que estás escuchando</span>
                </div>
              </div>

              {/* Sleep Timer Section */}
              <div className="p-4 rounded-lg bg-[#121212] border border-[#282828] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Moon className="w-5 h-5 text-indigo-400" />
                    <div>
                      <p className="text-sm font-bold text-white">Temporizador de Apagado (Sleep Timer)</p>
                      <p className="text-xs text-[#b3b3b3]">
                        {isSleepActive
                          ? `Activo: ${formatTime(sleepRemaining)} restante (${
                              sleepMode === 'end_of_track' ? 'Fin de pista' : 'Cuenta regresiva'
                            })`
                          : 'Desactivado'}
                      </p>
                    </div>
                  </div>
                  {isSleepActive && (
                    <button
                      type="button"
                      onClick={cancelSleepTimer}
                      className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 text-xs font-semibold hover:bg-rose-500/30 transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-xs text-[#888]">Apagado con fade-out de volumen de 3 segundos</span>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      openSleepModal();
                    }}
                    className="px-3.5 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>Configurar Temporizador</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Background switch */}
              {onToggleDynamicBg && (
                <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#121212] border border-[#282828]">
                  <div className="flex items-start gap-3">
                    <Palette className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-white">Fondo Reactivo Dinámico</p>
                      <p className="text-xs text-[#b3b3b3] mt-0.5">
                        Extrae en tiempo real la paleta cromática dominante de la portada del álbum para teñir suavemente la interfaz.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onToggleDynamicBg}
                    className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ml-4 ${
                      isDynamicBgEnabled ? 'bg-[#1db954]' : 'bg-[#3e3e3e]'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        isDynamicBgEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              )}

              {/* Spicetify Themes & Backgrounds banner */}
              {onOpenThemeGallery && (
                <div
                  className="p-4 rounded-xl border flex items-center justify-between"
                  style={{
                    background: 'linear-gradient(to right, color-mix(in srgb, var(--spice-button, #1db954) 18%, transparent), rgba(255, 255, 255, 0.03))',
                    borderColor: 'color-mix(in srgb, var(--spice-button, #1db954) 30%, transparent)'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shadow"
                      style={{
                        backgroundColor: 'var(--spice-button, #1db954)',
                        color: 'var(--spice-main, #000000)'
                      }}
                    >
                      <Palette className="w-5 h-5 text-current" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white uppercase tracking-wider">Temas</p>
                      <p className="text-xs text-white/80">Fondos animados en tiempo real, bucles de video y temas Spicetify</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenThemeGallery();
                    }}
                    className="text-xs font-bold bg-white text-black px-3.5 py-1.5 rounded-full hover:scale-105 transition-transform cursor-pointer"
                  >
                    Explorar Temas
                  </button>
                </div>
              )}

              {/* Wrapped banner inside settings */}
              {onOpenSoundCapsule && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/15 to-white/5 border border-amber-400/25 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow">
                      <Crown className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white uppercase tracking-wider">Harmonia Wrapped</p>
                      <p className="text-xs text-white/80">Descubre tu Arquetipo y minutos de escucha</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenSoundCapsule();
                    }}
                    className="text-xs font-bold bg-white text-black px-3.5 py-1.5 rounded-full hover:scale-105 transition-transform"
                  >
                    Ver Cápsula
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
