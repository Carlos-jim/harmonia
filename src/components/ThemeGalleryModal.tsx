import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Palette,
  Sliders,
  Film,
  Eye,
  Feather,
  Code,
  Download,
  Wand2,
  RefreshCw,
  ShieldCheck,
  Globe,
  ExternalLink,
  Layers,
  ChevronLeft,
  ChevronRight,
  GitCommit,
  Waves,
  Flame,
  Zap
} from 'lucide-react';
import { useThemeStore } from '../stores/useThemeStore';
import { THEME_PRESETS } from '../data/themePresets';
import { ThemePreset } from '../types/theme';
import { MiniThemePreview } from './MiniThemePreview';
import { SpicetifyMockupPreview } from './SpicetifyMockupPreview';
import {
  spicetifyEngine,
  SpicetifyTheme,
  SpicetifyColorScheme
} from '../services/theme/SpicetifyThemeEngine';

export const ThemeGalleryModal: React.FC = () => {
  const {
    currentPresetId,
    customUrl,
    customType,
    blur,
    opacity,
    isThemeGalleryOpen,
    setPreset,
    setMood,
    setCustomBackground,
    closeThemeGallery
  } = useThemeStore();

  const [activeTab, setActiveTab] = useState<'spicetify' | 'shaders' | 'editor'>('spicetify');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [inputCustomUrl, setInputCustomUrl] = useState(customUrl);
  const [inputCustomType, setInputCustomType] = useState<'image-static' | 'video-loop'>(
    customType === 'video-loop' ? 'video-loop' : 'image-static'
  );

  // Spicetify State
  const [spicetifyThemes, setSpicetifyThemes] = useState<SpicetifyTheme[]>(() =>
    spicetifyEngine.getThemes()
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(() =>
    spicetifyEngine.getIsSyncing()
  );
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(() =>
    spicetifyEngine.getLastSyncTime()
  );
  const [themeScopeFilter, setThemeScopeFilter] = useState<'all' | 'curated' | 'community'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 6;

  const [selectedSpicetifyThemeId, setSelectedSpicetifyThemeId] = useState<string>(() =>
    spicetifyEngine.getCurrentThemeId()
  );
  const [selectedSchemeName, setSelectedSchemeName] = useState<string>(() =>
    spicetifyEngine.getCurrentSchemeName()
  );
  const [iniInputText, setIniInputText] = useState<string>('');
  const [userCssInput, setUserCssInput] = useState<string>(() =>
    spicetifyEngine.getCustomCss()
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = spicetifyEngine.subscribe(() => {
      setSpicetifyThemes(spicetifyEngine.getThemes());
      setIsSyncing(spicetifyEngine.getIsSyncing());
      setLastSyncTime(spicetifyEngine.getLastSyncTime());
    });
    return unsubscribe;
  }, []);

  const handleSyncWithGitHub = async () => {
    setStatusMessage('Sincronizando temas con api.github.com/spicetify/spicetify-themes (Licencia MIT)...');
    const result = await spicetifyEngine.syncThemesFromGitHub();
    if (result.success) {
      setStatusMessage(`Sincronización exitosa: ${result.count} temas de la comunidad actualizados.`);
    } else {
      setStatusMessage(`Aviso: ${result.error || 'No se pudo conectar a GitHub'}`);
    }
    setTimeout(() => setStatusMessage(null), 4000);
  };

  if (!isThemeGalleryOpen) return null;

  const categories = [
    { label: 'Todos', count: THEME_PRESETS.length },
    { label: 'Animado', count: THEME_PRESETS.filter((p) => p.category === 'Animado').length },
    { label: 'Reactivo', count: THEME_PRESETS.filter((p) => p.category === 'Reactivo').length },
    { label: 'Minimalista', count: THEME_PRESETS.filter((p) => p.category === 'Minimalista').length },
    { label: 'Personalizado', count: 1 }
  ];

  const filteredPresets =
    selectedCategory === 'Todos'
      ? THEME_PRESETS
      : THEME_PRESETS.filter((p) => p.category === selectedCategory);

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCustomUrl.trim()) return;
    setCustomBackground(inputCustomUrl.trim(), inputCustomType);
  };

  const handleApplySpicetifyScheme = (themeId: string, schemeName: string) => {
    setSelectedSpicetifyThemeId(themeId);
    setSelectedSchemeName(schemeName);
    spicetifyEngine.setThemeAndScheme(themeId, schemeName);

    // Activamos el preset Spicetify en Harmonia para que la UI mute de inmediato
    setPreset('spicetify');
    const theme = spicetifyEngine.getTheme(themeId);
    const scheme = theme?.schemes.find((s) => s.name === schemeName) || theme?.schemes[0];
    if (scheme) {
      useThemeStore.getState().setAccentColor(scheme.colors.button);
    }

    setStatusMessage(`Tema Spicetify aplicado: ${theme?.name || themeId} (${schemeName})`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleParseCustomIni = (e: React.FormEvent) => {
    e.preventDefault();
    if (!iniInputText.trim()) return;
    const schemes = spicetifyEngine.parseColorIni(iniInputText);
    if (schemes.length > 0) {
      spicetifyEngine.applyScheme(schemes[0]);
      setStatusMessage(`¡Éxito! Esquema [${schemes[0].name}] importado y aplicado correctamente.`);
    } else {
      setStatusMessage('No se encontraron secciones válidas [Esquema] en el texto INI.');
    }
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleApplyUserCss = (e: React.FormEvent) => {
    e.preventDefault();
    spicetifyEngine.applyCustomCss(userCssInput);
    setStatusMessage('¡user.css inyectado en vivo en Harmonia!');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-5xl max-h-[88vh] harmonia-modal-glass rounded-3xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-white/10">
        
        {/* Header estilo Spicetify */}
        <div
          className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between transition-colors duration-300"
          style={{
            background: 'linear-gradient(to right, color-mix(in srgb, var(--spice-button, #1db954) 22%, transparent), transparent)'
          }}
        >
          <div className="flex items-center gap-3.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300"
              style={{
                backgroundColor: 'var(--spice-button, #1db954)',
                color: 'var(--spice-main, #000000)',
                boxShadow: '0 4px 20px color-mix(in srgb, var(--spice-button, #1db954) 35%, transparent)'
              }}
            >
              <Palette className="w-5 h-5 text-current" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Temas
              </h2>
            </div>
          </div>

          <button
            onClick={closeThemeGallery}
            className="p-2 text-[#b3b3b3] hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            title="Cerrar galería"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notificación de estado temporal */}
        {statusMessage && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/40 text-emerald-300 px-6 py-2 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Barra de Pestañas Principales */}
        <div className="px-5 sm:px-6 py-3 bg-white/[0.02] backdrop-blur-md border-b border-white/5 flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('spicetify')}
              style={activeTab === 'spicetify' ? { backgroundColor: 'var(--spice-button, #1db954)', color: 'var(--spice-main, #000000)' } : undefined}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'spicetify'
                  ? 'shadow-lg shadow-black/20'
                  : 'bg-white/5 text-[#b3b3b3] hover:text-white hover:bg-white/10'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Temas Spicetify (color.ini)</span>
            </button>

            <button
              onClick={() => setActiveTab('shaders')}
              style={activeTab === 'shaders' ? { backgroundColor: 'var(--spice-button, #1db954)', color: 'var(--spice-main, #000000)' } : undefined}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'shaders'
                  ? 'shadow-lg shadow-black/20'
                  : 'bg-white/5 text-[#b3b3b3] hover:text-white hover:bg-white/10'
              }`}
            >
              <Waves className="w-4 h-4" />
              <span>Fondos & Shaders Animados</span>
            </button>

            <button
              onClick={() => setActiveTab('editor')}
              style={activeTab === 'editor' ? { backgroundColor: 'var(--spice-button, #1db954)', color: 'var(--spice-main, #000000)' } : undefined}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'editor'
                  ? 'shadow-lg shadow-black/20'
                  : 'bg-white/5 text-[#b3b3b3] hover:text-white hover:bg-white/10'
              }`}
            >
              <Code className="w-4 h-4" />
              <span>Editor color.ini & user.css</span>
            </button>
          </div>
        </div>

        {/* Contenido Principal de las Pestañas */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-6">

          {/* TAB 1: SPICETIFY THEMES & PALETTES */}
          {activeTab === 'spicetify' && (() => {
            const curatedCount = spicetifyThemes.filter((t) => !t.isCommunity).length;
            const communityCount = spicetifyThemes.filter((t) => t.isCommunity).length;
            const displayedThemes = spicetifyThemes.filter((t) => {
              if (themeScopeFilter === 'curated') return !t.isCommunity;
              if (themeScopeFilter === 'community') return t.isCommunity;
              return true;
            });

            const totalPages = Math.ceil(displayedThemes.length / ITEMS_PER_PAGE) || 1;
            const safeCurrentPage = Math.min(currentPage, totalPages);
            const paginatedThemes = displayedThemes.slice(
              (safeCurrentPage - 1) * ITEMS_PER_PAGE,
              safeCurrentPage * ITEMS_PER_PAGE
            );

            const commitInfo = spicetifyEngine.getLastCommitInfo();

            const formatSyncTime = (timestamp: number | null) => {
              if (!timestamp) return 'Pendiente de sincronizar';
              const diffMs = Date.now() - timestamp;
              const diffMins = Math.floor(diffMs / 60000);
              if (diffMins < 1) return 'Actualizado hace un momento';
              if (diffMins < 60) return `Actualizado hace ${diffMins} min`;
              const diffHours = Math.floor(diffMins / 60);
              return `Actualizado hace ${diffHours} h`;
            };

            return (
              <div className="flex flex-col gap-4">
                {/* Header de Sincronización y Validación Legal */}
                <div
                  className="p-3.5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors duration-300"
                  style={{
                    background: 'linear-gradient(to right, color-mix(in srgb, var(--spice-button, #1db954) 15%, transparent), rgba(0, 0, 0, 0.4))',
                    borderColor: 'color-mix(in srgb, var(--spice-button, #1db954) 25%, transparent)'
                  }}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div
                        className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-bold"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--spice-button, #1db954) 15%, transparent)',
                          borderColor: 'color-mix(in srgb, var(--spice-button, #1db954) 30%, transparent)',
                          color: 'var(--spice-text, #ffffff)'
                        }}
                      >
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--spice-button, #1db954)' }} />
                        <span>100% Legal & Open Source (Licencia MIT)</span>
                      </div>
                      <span className="text-[11px] text-[#8e8e8e] font-mono">
                        {formatSyncTime(lastSyncTime)}
                      </span>
                    </div>
                    <p className="text-xs text-[#b3b3b3] leading-relaxed">
                      Catálogo sincronizado desde el repositorio oficial <a href="https://github.com/spicetify/spicetify-themes" target="_blank" rel="noreferrer" className="hover:underline font-semibold inline-flex items-center gap-1" style={{ color: 'var(--spice-button, #1db954)' }}>spicetify/spicetify-themes <ExternalLink className="w-3 h-3 inline" /></a>.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={async () => {
                        await handleSyncWithGitHub();
                        await spicetifyEngine.checkForGitHubUpdates();
                      }}
                      disabled={isSyncing}
                      style={{
                        backgroundColor: 'var(--spice-button, #1db954)',
                        color: 'var(--spice-main, #000000)'
                      }}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl font-extrabold text-xs transition-all cursor-pointer shadow-lg disabled:opacity-50 hover:brightness-110 active:scale-95"
                      title="Sincronizar nuevos temas y actualizaciones desde GitHub"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar con GitHub'}</span>
                    </button>
                  </div>
                </div>

                {/* Filtros de Alcance: Todos, Oficiales Harmonia, Comunidad GitHub */}
                <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
                  <button
                    onClick={() => {
                      setThemeScopeFilter('all');
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                      themeScopeFilter === 'all'
                        ? 'bg-white text-black border-white shadow-md'
                        : 'bg-white/5 text-[#b3b3b3] hover:text-white hover:bg-white/10 border-white/5'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Todos ({spicetifyThemes.length})</span>
                  </button>

                  <button
                    onClick={() => {
                      setThemeScopeFilter('curated');
                      setCurrentPage(1);
                    }}
                    style={themeScopeFilter === 'curated' ? { backgroundColor: 'var(--spice-button, #1db954)', color: 'var(--spice-main, #000000)', borderColor: 'var(--spice-button, #1db954)' } : undefined}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                      themeScopeFilter === 'curated'
                        ? 'shadow-md'
                        : 'bg-white/5 text-[#b3b3b3] hover:text-white hover:bg-white/10 border-white/5'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>Curados Harmonia ({curatedCount})</span>
                  </button>

                  <button
                    onClick={() => {
                      setThemeScopeFilter('community');
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                      themeScopeFilter === 'community'
                        ? 'bg-emerald-500 text-black border-emerald-500 shadow-md shadow-emerald-500/20'
                        : 'bg-white/5 text-[#b3b3b3] hover:text-white hover:bg-white/10 border-white/5'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Comunidad GitHub ({communityCount})</span>
                  </button>
                </div>

                {/* Grid Paginado de Temas Spicetify (6 por página para no desbordar) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {paginatedThemes.map((theme: SpicetifyTheme) => {
                    const isThemeSelected = selectedSpicetifyThemeId === theme.id;
                    const activeScheme =
                      isThemeSelected
                        ? theme.schemes.find((s) => s.name === selectedSchemeName) || theme.schemes[0]
                        : theme.schemes[0];

                    return (
                      <div
                        key={theme.id}
                        className={`group relative rounded-2xl border p-3 flex flex-col justify-between transition-all backdrop-blur-xl gap-2.5 ${
                          isThemeSelected
                            ? 'border-[#1db954] bg-white/[0.08] ring-2 ring-[#1db954]/40 shadow-xl'
                            : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
                        }`}
                      >
                        {/* Vista previa en tiempo real estilo Spicetify (Miniatura UI + Foto) */}
                        <SpicetifyMockupPreview
                          theme={theme}
                          activeScheme={activeScheme}
                        />

                        {/* Datos del Tema */}
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <h4 className="font-extrabold text-sm text-white tracking-tight truncate">
                                {theme.name}
                              </h4>
                              {theme.isCommunity && (
                                <span className="text-[8px] bg-emerald-500/15 text-emerald-300 font-bold px-1.5 py-0.2 rounded border border-emerald-500/30 uppercase tracking-wider shrink-0">
                                  MIT
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-[#727272] font-mono truncate max-w-[95px] shrink-0">
                              por {theme.author}
                            </span>
                          </div>

                          <p className="text-[11px] text-[#b3b3b3] truncate leading-tight">
                            {theme.description}
                          </p>

                          {/* Tira de Paleta de Color en Vivo */}
                          <div className="flex items-center gap-1 h-3.5 rounded p-0.5 bg-black/40 border border-white/10">
                            <div
                              className="flex-1 h-full rounded-sm"
                              style={{ backgroundColor: activeScheme.colors.main }}
                              title={`Fondo: ${activeScheme.colors.main}`}
                            />
                            <div
                              className="flex-1 h-full rounded-sm"
                              style={{ backgroundColor: activeScheme.colors.sidebar }}
                              title={`Barra: ${activeScheme.colors.sidebar}`}
                            />
                            <div
                              className="flex-1 h-full rounded-sm"
                              style={{ backgroundColor: activeScheme.colors.card }}
                              title={`Tarjetas: ${activeScheme.colors.card}`}
                            />
                            <div
                              className="flex-1 h-full rounded-sm"
                              style={{ backgroundColor: activeScheme.colors.button }}
                              title={`Acento: ${activeScheme.colors.button}`}
                            />
                            <div
                              className="flex-1 h-full rounded-sm"
                              style={{ backgroundColor: activeScheme.colors.text }}
                              title={`Texto: ${activeScheme.colors.text}`}
                            />
                          </div>

                          {/* Selector de Esquemas (color.ini [Scheme]) */}
                          {theme.schemes.length > 1 && (
                            <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar">
                              {theme.schemes.map((scheme: SpicetifyColorScheme) => {
                                const isSchemeActive =
                                  isThemeSelected && selectedSchemeName === scheme.name;

                                return (
                                  <button
                                    key={scheme.name}
                                    onClick={() => handleApplySpicetifyScheme(theme.id, scheme.name)}
                                    style={isSchemeActive ? { backgroundColor: 'var(--spice-button, #1db954)', color: 'var(--spice-main, #000000)', borderColor: 'var(--spice-button, #1db954)' } : undefined}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap border shrink-0 ${
                                      isSchemeActive
                                        ? 'shadow-sm'
                                        : 'bg-white/5 hover:bg-white/15 text-[#b3b3b3] hover:text-white border-white/5'
                                    }`}
                                  >
                                    {scheme.name}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Botones de Acción */}
                        <div className="flex items-center gap-1.5 pt-1">
                          <button
                            onClick={() => handleApplySpicetifyScheme(theme.id, activeScheme.name)}
                            style={isThemeSelected ? {
                              backgroundColor: 'color-mix(in srgb, var(--spice-button, #1db954) 20%, transparent)',
                              color: 'var(--spice-button, #1db954)',
                              borderColor: 'color-mix(in srgb, var(--spice-button, #1db954) 40%, transparent)'
                            } : undefined}
                            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow ${
                              isThemeSelected
                                ? 'border'
                                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                            }`}
                          >
                            {isThemeSelected ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Activo ({selectedSchemeName})</span>
                              </>
                            ) : (
                              <>
                                <Wand2 className="w-3.5 h-3.5" />
                                <span>Aplicar</span>
                              </>
                            )}
                          </button>

                          {theme.usercssUrl && (
                            <button
                              onClick={async () => {
                                const ok = await spicetifyEngine.loadThemeUserCss(theme);
                                if (ok) {
                                  setStatusMessage(`user.css de ${theme.name} inyectado con éxito.`);
                                } else {
                                  setStatusMessage(`No se pudo descargar user.css para ${theme.name}.`);
                                }
                                setTimeout(() => setStatusMessage(null), 3000);
                              }}
                              className="px-2 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-[#b3b3b3] hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                              title="Descargar e inyectar estilos user.css de este tema"
                            >
                              <Code className="w-3 h-3" />
                              <span className="text-[11px]">CSS</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Barra de Paginación y Monitor de Commits (Alternativa a Webhook) */}
                <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  {/* Info de Commit / Watcher */}
                  <div className="flex items-center gap-2 text-[#8e8e8e] font-mono text-[11px]">
                    <GitCommit className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>
                      SHA: <code className="text-white font-bold">{commitInfo.sha || 'c432012'}</code>
                      {commitInfo.message ? ` · ${commitInfo.message.slice(0, 28)}...` : ' · Auto-Watch activo'}
                    </span>
                  </div>

                  {/* Controles de Navegación de Páginas */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#8e8e8e] text-[11px] mr-2">
                      Página {safeCurrentPage} de {totalPages} ({displayedThemes.length} temas)
                    </span>

                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={safeCurrentPage === 1}
                      className="p-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors cursor-pointer border border-white/5"
                      title="Página anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        style={safeCurrentPage === page ? { backgroundColor: 'var(--spice-button, #1db954)', color: 'var(--spice-main, #000000)', borderColor: 'var(--spice-button, #1db954)' } : undefined}
                        className={`w-6 h-6 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                          safeCurrentPage === page
                            ? 'shadow-md'
                            : 'bg-white/5 hover:bg-white/15 text-[#b3b3b3] hover:text-white border-white/5'
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safeCurrentPage === totalPages}
                      className="p-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors cursor-pointer border border-white/5"
                      title="Página siguiente"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* TAB 2: SHADERS Y FONDOS ANIMADOS EN 60FPS */}
          {activeTab === 'shaders' && (
            <div className="flex flex-col gap-6">
              {/* Categorías / Filtros rápidos de fondos */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {categories.map((cat) => (
                  <button
                    key={cat.label}
                    onClick={() => setSelectedCategory(cat.label)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      selectedCategory === cat.label
                        ? 'bg-white text-black shadow-md scale-[1.02]'
                        : 'bg-white/5 text-[#b3b3b3] hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      selectedCategory === cat.label ? 'bg-black/15 text-black' : 'bg-white/10 text-[#727272]'
                    }`}>
                      {cat.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Grid de Plantillas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredPresets.map((preset: ThemePreset) => {
                  const isSelected = currentPresetId === preset.id;

                  return (
                    <div
                      key={preset.id}
                      onClick={() => setPreset(preset.id)}
                      className={`group relative rounded-2xl overflow-hidden border p-3 flex flex-col justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#1db954] bg-white/[0.08] ring-2 ring-[#1db954]/50 shadow-2xl shadow-[#1db954]/10 scale-[1.02]'
                          : 'border-white/10 bg-[#161616] hover:border-white/25 hover:bg-[#1e1e1e] hover:shadow-xl'
                      }`}
                    >
                      <div className="w-full h-32 rounded-xl relative overflow-hidden mb-3 shadow-inner border border-white/5">
                        <MiniThemePreview preset={preset} isSelected={isSelected} />

                        <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10 text-[9px] font-extrabold uppercase tracking-wider text-white">
                          {preset.type === 'animated-canvas' && (
                            <>
                              <Zap className="w-2.5 h-2.5 text-cyan-400" />
                              <span>Shader 60FPS</span>
                            </>
                          )}
                          {preset.type === 'video-loop' && (
                            <>
                              <Film className="w-2.5 h-2.5 text-sky-400" />
                              <span>Video HD</span>
                            </>
                          )}
                          {preset.type === 'dynamic-album' && (
                            <>
                              <Palette className="w-2.5 h-2.5 text-emerald-400" />
                              <span>Reactivo</span>
                            </>
                          )}
                          {preset.type === 'oled-black' && (
                            <span>Negro OLED</span>
                          )}
                        </div>

                        {isSelected && (
                          <div
                            className="absolute bottom-2 right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-lg"
                            style={{
                              backgroundColor: 'var(--spice-button, #1db954)',
                              color: 'var(--spice-main, #000000)'
                            }}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-1">
                        <h4 className="font-extrabold text-sm text-white truncate tracking-tight">
                          {preset.name}
                        </h4>
                        <p className="text-[11px] text-[#b3b3b3] line-clamp-2 leading-relaxed">
                          {preset.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Controles de Desenfoque y Opacidad */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <span>Calibración de Fondo:</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMood('subtle')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      blur >= 8
                        ? 'bg-emerald-500 text-black shadow-md'
                        : 'bg-white/5 text-[#b3b3b3] hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Feather className="w-3.5 h-3.5" />
                    <span>Sutil</span>
                  </button>

                  <button
                    onClick={() => setMood('balanced')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      blur > 0 && blur < 8
                        ? 'bg-emerald-500 text-black shadow-md'
                        : 'bg-white/5 text-[#b3b3b3] hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Equilibrado</span>
                  </button>

                  <button
                    onClick={() => setMood('immersive')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      blur === 0 && opacity >= 0.9
                        ? 'bg-emerald-500 text-black shadow-md'
                        : 'bg-white/5 text-[#b3b3b3] hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inmersivo</span>
                  </button>
                </div>
              </div>

              {/* Formulario de Fondo Personalizado */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Film className="w-4 h-4 text-purple-400" />
                  <span>Añadir Video o Fondo Propio (URL Directa)</span>
                </div>
                <form onSubmit={handleApplyCustom} className="flex flex-col sm:flex-row gap-2 mt-1">
                  <input
                    type="url"
                    value={inputCustomUrl}
                    onChange={(e) => setInputCustomUrl(e.target.value)}
                    placeholder="https://ejemplo.com/fondo-animado.mp4 o .jpg"
                    className="flex-1 bg-black/50 border border-white/15 focus:border-[#1db954] text-white text-xs rounded-xl px-3.5 py-2.5 outline-none transition-colors"
                    required
                  />

                  <div className="flex items-center gap-2">
                    <select
                      value={inputCustomType}
                      onChange={(e) => setInputCustomType(e.target.value as 'image-static' | 'video-loop')}
                      className="bg-black/50 border border-white/15 text-white text-xs rounded-xl px-3 py-2.5 outline-none"
                    >
                      <option value="image-static">Imagen / GIF</option>
                      <option value="video-loop">Video MP4 en Bucle</option>
                    </select>

                    <button
                      type="submit"
                      className="bg-[#1db954] hover:bg-[#1ed760] text-black font-bold text-xs px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap cursor-pointer shadow-md"
                    >
                      Aplicar Fondo
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: EDITOR SPICETIFY (color.ini y user.css) */}
          {activeTab === 'editor' && (
            <div className="flex flex-col gap-6">
              {/* Sección 1: Importador de color.ini */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-sm font-bold text-white">
                      Importar color.ini Oficial de Spicetify
                    </h4>
                  </div>
                  <span className="text-[10px] text-[#727272]">Parser INI Nativo</span>
                </div>

                <p className="text-xs text-[#b3b3b3]">
                  Pega directamente el contenido de cualquier archivo <code className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">color.ini</code> encontrado en el repositorio <strong className="text-white">spicetify/spicetify-themes</strong> para aplicarlo al instante en Harmonia.
                </p>

                <form onSubmit={handleParseCustomIni} className="flex flex-col gap-2 mt-1">
                  <textarea
                    value={iniInputText}
                    onChange={(e) => setIniInputText(e.target.value)}
                    placeholder={`[MiEsquemaPersonalizado]\nmain = 1e1e2e\nsidebar = 181825\nplayer = 11111b\ncard = 313244\nbutton = cba6f7\ntext = cdd6f4\nsubtext = a6adc8`}
                    className="w-full h-32 bg-black/60 border border-white/15 focus:border-[#1db954] rounded-xl p-3 font-mono text-xs text-white/90 outline-none resize-none"
                  />

                  <button
                    type="submit"
                    className="self-end bg-[#1db954] hover:bg-[#1ed760] text-black font-bold text-xs px-5 py-2 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md"
                  >
                    Procesar y Aplicar color.ini
                  </button>
                </form>
              </div>

              {/* Sección 2: Inyector de user.css */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-sm font-bold text-white">
                      Inyector de Estilos en Vivo (user.css)
                    </h4>
                  </div>
                  <span className="text-[10px] text-[#727272]">Live CSS Injection</span>
                </div>

                <p className="text-xs text-[#b3b3b3]">
                  Escribe o pega reglas CSS personalizadas. Se inyectarán directamente en el DOM de la aplicación en tiempo real.
                </p>

                <form onSubmit={handleApplyUserCss} className="flex flex-col gap-2 mt-1">
                  <textarea
                    value={userCssInput}
                    onChange={(e) => setUserCssInput(e.target.value)}
                    placeholder={`/* Ejemplo de personalización en vivo */\n:root {\n  --accent: #a855f7;\n}\n\naside {\n  backdrop-filter: blur(30px) !important;\n}`}
                    className="w-full h-32 bg-black/60 border border-white/15 focus:border-cyan-400 rounded-xl p-3 font-mono text-xs text-white/90 outline-none resize-none"
                  />

                  <button
                    type="submit"
                    className="self-end bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs px-5 py-2 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md"
                  >
                    Inyectar user.css en Harmonia
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
