export interface SpicetifyColors {
  text: string;
  subtext: string;
  main: string;
  sidebar: string;
  player: string;
  card: string;
  shadow: string;
  selectedRow: string;
  button: string;
  buttonActive: string;
  buttonDisabled: string;
  tabActive: string;
  notification: string;
  notificationError: string;
  misc: string;
}

export interface SpicetifyColorScheme {
  name: string;
  colors: SpicetifyColors;
}

export interface SpicetifyTheme {
  id: string;
  name: string;
  author: string;
  description: string;
  previewGradient: string;
  activeScheme: string;
  schemes: SpicetifyColorScheme[];
  customCss?: string;
  usercssUrl?: string;
  previewUrl?: string;
  isCommunity?: boolean;
}

export const SPICETIFY_OFFICIAL_THEMES: SpicetifyTheme[] = [
  {
    id: 'catppuccin',
    name: 'Catppuccin',
    author: 'Catppuccin Org',
    description: 'La paleta pastel relajante para la vista más popular del mundo open source. 4 esquemas oficiales.',
    previewGradient: 'from-purple-500 via-indigo-600 to-slate-900',
    previewUrl: 'https://raw.githubusercontent.com/catppuccin/spicetify/main/assets/preview.webp',
    activeScheme: 'Mocha',
    schemes: [
      {
        name: 'Mocha',
        colors: {
          main: '#1e1e2e',
          sidebar: '#181825',
          player: '#11111b',
          card: '#313244',
          shadow: '#11111b',
          selectedRow: '#45475a',
          button: '#cba6f7',
          buttonActive: '#b4befe',
          buttonDisabled: '#585b70',
          tabActive: '#cba6f7',
          text: '#cdd6f4',
          subtext: '#a6adc8',
          notification: '#89b4fa',
          notificationError: '#f38ba8',
          misc: '#45475a'
        }
      },
      {
        name: 'Macchiato',
        colors: {
          main: '#24273a',
          sidebar: '#1e2030',
          player: '#181926',
          card: '#363a4f',
          shadow: '#181926',
          selectedRow: '#494d64',
          button: '#c6a0f6',
          buttonActive: '#b7bdf8',
          buttonDisabled: '#5b6078',
          tabActive: '#c6a0f6',
          text: '#cad3f5',
          subtext: '#a5adcb',
          notification: '#8aadf4',
          notificationError: '#ed8796',
          misc: '#494d64'
        }
      },
      {
        name: 'Frappe',
        colors: {
          main: '#303446',
          sidebar: '#292c3c',
          player: '#232634',
          card: '#414559',
          shadow: '#232634',
          selectedRow: '#51576d',
          button: '#ca9ee6',
          buttonActive: '#babbf1',
          buttonDisabled: '#626880',
          tabActive: '#ca9ee6',
          text: '#c6d0f5',
          subtext: '#a5adce',
          notification: '#8caaee',
          notificationError: '#e78284',
          misc: '#51576d'
        }
      },
      {
        name: 'Latte',
        colors: {
          main: '#eff1f5',
          sidebar: '#e6e9ef',
          player: '#dce0e8',
          card: '#ccd0da',
          shadow: '#bcc0cc',
          selectedRow: '#acb0be',
          button: '#8839ef',
          buttonActive: '#7287fd',
          buttonDisabled: '#9ca0b0',
          tabActive: '#8839ef',
          text: '#4c4f69',
          subtext: '#6c6f85',
          notification: '#1e66f5',
          notificationError: '#d20f39',
          misc: '#8c8fa1'
        }
      }
    ]
  },
  {
    id: 'bloom',
    name: 'Bloom (Apple Music Liquid)',
    author: 'nimsandu',
    description: 'Inspirado en Apple Music: fondos de cristal líquido, ambient aura reactivo y desenfoques gaussianos.',
    previewGradient: 'from-rose-500 via-pink-700 to-indigo-950',
    activeScheme: 'Dark Glass',
    schemes: [
      {
        name: 'Dark Glass',
        colors: {
          main: '#0a0a0f',
          sidebar: '#07070a',
          player: '#101018',
          card: '#181824',
          shadow: '#050508',
          selectedRow: '#252538',
          button: '#fa2d48',
          buttonActive: '#ff4760',
          buttonDisabled: '#454555',
          tabActive: '#fa2d48',
          text: '#ffffff',
          subtext: '#a0a0b0',
          notification: '#fa2d48',
          notificationError: '#e11d48',
          misc: '#303045'
        }
      },
      {
        name: 'Cyber Glass',
        colors: {
          main: '#130a21',
          sidebar: '#0d0617',
          player: '#1a0d2e',
          card: '#251340',
          shadow: '#090410',
          selectedRow: '#3b1d66',
          button: '#d946ef',
          buttonActive: '#e879f9',
          buttonDisabled: '#5b2f8a',
          tabActive: '#d946ef',
          text: '#ffffff',
          subtext: '#c084fc',
          notification: '#a855f7',
          notificationError: '#f43f5e',
          misc: '#4c2882'
        }
      }
    ]
  },
  {
    id: 'dribbblish',
    name: 'Dribbblish',
    author: 'JulienMaille',
    description: 'El tema más legendario de Spicetify. Diseño modular, gradientes sutiles y tarjetas bien definidas.',
    previewGradient: 'from-emerald-600 via-teal-900 to-black',
    previewUrl: 'https://raw.githubusercontent.com/spicetify/spicetify-themes/master/Dribbblish/base.png',
    activeScheme: 'Base',
    schemes: [
      {
        name: 'Base',
        colors: {
          main: '#181818',
          sidebar: '#121212',
          player: '#181818',
          card: '#282828',
          shadow: '#000000',
          selectedRow: '#2a2a2a',
          button: '#1db954',
          buttonActive: '#1ed760',
          buttonDisabled: '#535353',
          tabActive: '#1db954',
          text: '#ffffff',
          subtext: '#b3b3b3',
          notification: '#1db954',
          notificationError: '#e91429',
          misc: '#7f7f7f'
        }
      },
      {
        name: 'Dracula',
        colors: {
          main: '#282a36',
          sidebar: '#21222c',
          player: '#191a21',
          card: '#44475a',
          shadow: '#191a21',
          selectedRow: '#44475a',
          button: '#bd93f9',
          buttonActive: '#ff79c6',
          buttonDisabled: '#6272a4',
          tabActive: '#bd93f9',
          text: '#f8f8f2',
          subtext: '#6272a4',
          notification: '#8be9fd',
          notificationError: '#ff5555',
          misc: '#6272a4'
        }
      },
      {
        name: 'Nord',
        colors: {
          main: '#2e3440',
          sidebar: '#242933',
          player: '#1d212a',
          card: '#3b4252',
          shadow: '#1d212a',
          selectedRow: '#434c5e',
          button: '#88c0d0',
          buttonActive: '#81a1c1',
          buttonDisabled: '#4c566a',
          tabActive: '#88c0d0',
          text: '#eceff4',
          subtext: '#d8dee9',
          notification: '#a3be8c',
          notificationError: '#bf616a',
          misc: '#4c566a'
        }
      },
      {
        name: 'Cyberpunk',
        colors: {
          main: '#000b1e',
          sidebar: '#000814',
          player: '#000b1e',
          card: '#0d2040',
          shadow: '#00050f',
          selectedRow: '#143160',
          button: '#ffee00',
          buttonActive: '#00f0ff',
          buttonDisabled: '#083050',
          tabActive: '#ffee00',
          text: '#00f0ff',
          subtext: '#ff0055',
          notification: '#00f0ff',
          notificationError: '#ff0055',
          misc: '#00f0ff'
        }
      }
    ]
  },
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    author: 'enkia',
    description: 'Estética neón de medianoche en Tokio. Colores azules y violetas profundos de alta tecnología.',
    previewGradient: 'from-blue-600 via-indigo-900 to-slate-950',
    activeScheme: 'Storm',
    schemes: [
      {
        name: 'Storm',
        colors: {
          main: '#24283b',
          sidebar: '#1f2335',
          player: '#1a1b26',
          card: '#292e42',
          shadow: '#141620',
          selectedRow: '#3b4261',
          button: '#7aa2f7',
          buttonActive: '#bb9af7',
          buttonDisabled: '#565f89',
          tabActive: '#7aa2f7',
          text: '#c0caf5',
          subtext: '#9aa5ce',
          notification: '#7dcfff',
          notificationError: '#f7768e',
          misc: '#565f89'
        }
      },
      {
        name: 'Night',
        colors: {
          main: '#1a1b26',
          sidebar: '#16161e',
          player: '#13141c',
          card: '#24283b',
          shadow: '#0f1016',
          selectedRow: '#2f354f',
          button: '#7aa2f7',
          buttonActive: '#7dcfff',
          buttonDisabled: '#414868',
          tabActive: '#7aa2f7',
          text: '#a9b1d6',
          subtext: '#787c99',
          notification: '#9ece6a',
          notificationError: '#f7768e',
          misc: '#414868'
        }
      }
    ]
  },
  {
    id: 'comfy',
    name: 'Comfy',
    author: 'Comfy-Themes',
    description: 'Estética ergonómica ultra-redondeada con glow ambiental detrás de la música en reproducción.',
    previewGradient: 'from-amber-600 via-rose-900 to-stone-950',
    activeScheme: 'Cozy Dark',
    schemes: [
      {
        name: 'Cozy Dark',
        colors: {
          main: '#1e1e28',
          sidebar: '#16161f',
          player: '#13131b',
          card: '#2b2b3a',
          shadow: '#0d0d12',
          selectedRow: '#38384d',
          button: '#b48ead',
          buttonActive: '#d08770',
          buttonDisabled: '#4c4c60',
          tabActive: '#b48ead',
          text: '#e5e9f0',
          subtext: '#abb2bf',
          notification: '#a3be8c',
          notificationError: '#bf616a',
          misc: '#5c5c75'
        }
      }
    ]
  }
];

const SPICE_STORAGE_THEME = 'harmonia_spicetify_theme_id';
const SPICE_STORAGE_SCHEME = 'harmonia_spicetify_scheme_name';
const SPICE_STORAGE_CUSTOM_CSS = 'harmonia_spicetify_custom_css';
const SPICE_STORAGE_COMMUNITY_THEMES = 'harmonia_spicetify_community_themes';
const SPICE_STORAGE_LAST_SYNC = 'harmonia_spicetify_last_sync';
const SPICE_STORAGE_COMMIT_SHA = 'harmonia_spicetify_commit_sha';
const SPICE_STORAGE_COMMIT_MSG = 'harmonia_spicetify_commit_msg';
const SPICE_STORAGE_COMMIT_DATE = 'harmonia_spicetify_commit_date';

interface ManifestTheme {
  name: string;
  description?: string;
  preview?: string;
  readme?: string;
  usercss?: string;
  schemes?: string;
  authors?: Array<{ name: string; url?: string }>;
  tags?: string[];
}

export class SpicetifyThemeEngine {
  private currentThemeId: string = 'dribbblish';
  private currentSchemeName: string = 'Base';
  private customCss: string = '';
  private communityThemes: SpicetifyTheme[] = [];
  private isSyncing: boolean = false;
  private lastSyncTime: number | null = null;
  private lastCommitSha: string | null = null;
  private lastCommitMessage: string | null = null;
  private lastCommitDate: string | null = null;
  private listeners: Array<() => void> = [];

  constructor() {
    this.init();
  }

  private init() {
    if (typeof localStorage === 'undefined') return;
    try {
      this.currentThemeId = localStorage.getItem(SPICE_STORAGE_THEME) || 'dribbblish';
      this.currentSchemeName = localStorage.getItem(SPICE_STORAGE_SCHEME) || 'Base';
      this.customCss = localStorage.getItem(SPICE_STORAGE_CUSTOM_CSS) || '';

      const savedCommunity = localStorage.getItem(SPICE_STORAGE_COMMUNITY_THEMES);
      if (savedCommunity) {
        try {
          this.communityThemes = JSON.parse(savedCommunity);
        } catch {}
      }

      const savedSync = localStorage.getItem(SPICE_STORAGE_LAST_SYNC);
      if (savedSync) {
        this.lastSyncTime = parseInt(savedSync, 10);
      }

      this.lastCommitSha = localStorage.getItem(SPICE_STORAGE_COMMIT_SHA);
      this.lastCommitMessage = localStorage.getItem(SPICE_STORAGE_COMMIT_MSG);
      this.lastCommitDate = localStorage.getItem(SPICE_STORAGE_COMMIT_DATE);

      const theme = this.getTheme(this.currentThemeId) || SPICETIFY_OFFICIAL_THEMES[2];
      const scheme = theme.schemes.find((s) => s.name === this.currentSchemeName) || theme.schemes[0];
      this.applyScheme(scheme);
      if (this.customCss) {
        this.applyCustomCss(this.customCss);
      }

      // Sincronización automática periódica en segundo plano
      this.autoSyncIfStale();
      this.checkForGitHubUpdates().catch(() => {});
    } catch (e) {
      console.warn('Error loading Spicetify theme configuration:', e);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('Error in theme engine listener:', err);
      }
    });
  }

  public getThemes(): SpicetifyTheme[] {
    const existingIds = new Set(SPICETIFY_OFFICIAL_THEMES.map((t) => t.id));
    const uniqueCommunity = this.communityThemes.filter((t) => !existingIds.has(t.id));
    return [...SPICETIFY_OFFICIAL_THEMES, ...uniqueCommunity];
  }

  public getTheme(id: string): SpicetifyTheme | undefined {
    return this.getThemes().find((t) => t.id === id);
  }

  public getIsSyncing(): boolean {
    return this.isSyncing;
  }

  public getLastSyncTime(): number | null {
    return this.lastSyncTime;
  }

  /**
   * Sincroniza automáticamente los temas desde el repositorio oficial de GitHub
   * spicetify/spicetify-themes (Licencia MIT)
   */
  public async syncThemesFromGitHub(): Promise<{ success: boolean; count: number; error?: string }> {
    if (this.isSyncing) {
      return { success: false, count: 0, error: 'Sincronización en curso' };
    }

    this.isSyncing = true;
    this.notify();

    try {
      const manifestUrl = 'https://raw.githubusercontent.com/spicetify/spicetify-themes/master/manifest.json';
      const res = await fetch(manifestUrl);
      if (!res.ok) throw new Error(`HTTP error ${res.status} al consultar manifest.json`);

      const manifest: ManifestTheme[] = await res.json();
      const loadedThemes: SpicetifyTheme[] = [];

      const gradients = [
        'from-blue-600 via-indigo-600 to-slate-900',
        'from-emerald-600 via-teal-700 to-black',
        'from-rose-600 via-pink-600 to-neutral-900',
        'from-amber-600 via-orange-600 to-stone-900',
        'from-fuchsia-600 via-purple-700 to-zinc-900',
        'from-cyan-600 via-blue-700 to-slate-950',
        'from-violet-600 via-indigo-700 to-gray-900',
        'from-teal-600 via-emerald-700 to-stone-950',
      ];

      await Promise.allSettled(
        manifest.map(async (item, idx) => {
          if (!item.schemes) return;
          try {
            const iniUrl = `https://raw.githubusercontent.com/spicetify/spicetify-themes/master/${item.schemes}`;
            const iniRes = await fetch(iniUrl);
            if (!iniRes.ok) return;

            const iniText = await iniRes.text();
            const schemes = this.parseColorIni(iniText);
            if (!schemes || schemes.length === 0) return;

            const themeId = item.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
            const author = item.authors?.[0]?.name || 'Comunidad Spicetify';
            const gradient = gradients[idx % gradients.length];

            const previewUrl = item.preview
              ? item.preview.startsWith('http')
                ? item.preview
                : `https://raw.githubusercontent.com/spicetify/spicetify-themes/master/${item.preview}`
              : undefined;

            const themeObj: SpicetifyTheme = {
              id: themeId,
              name: item.name,
              author,
              description: item.description || `Tema de la comunidad Spicetify (${item.name}) bajo Licencia MIT oficial.`,
              previewGradient: gradient,
              previewUrl,
              activeScheme: schemes[0].name,
              schemes,
              usercssUrl: item.usercss
                ? `https://raw.githubusercontent.com/spicetify/spicetify-themes/master/${item.usercss}`
                : undefined,
              isCommunity: true
            };

            loadedThemes.push(themeObj);
          } catch (err) {
            console.warn(`Error al descargar tema ${item.name}:`, err);
          }
        })
      );

      if (loadedThemes.length > 0) {
        this.communityThemes = loadedThemes;
        this.lastSyncTime = Date.now();
        try {
          localStorage.setItem(SPICE_STORAGE_COMMUNITY_THEMES, JSON.stringify(loadedThemes));
          localStorage.setItem(SPICE_STORAGE_LAST_SYNC, this.lastSyncTime.toString());
        } catch {}
      }

      this.isSyncing = false;
      this.notify();
      return { success: true, count: loadedThemes.length };
    } catch (err: any) {
      this.isSyncing = false;
      this.notify();
      console.error('Error al sincronizar temas con GitHub:', err);
      return { success: false, count: 0, error: err.message || 'Error de red con GitHub' };
    }
  }

  /**
   * Sincroniza si han pasado más de 24 horas desde la última sincronización
   */
  public autoSyncIfStale(maxAgeMs = 24 * 60 * 60 * 1000) {
    const isStale = !this.lastSyncTime || (Date.now() - this.lastSyncTime > maxAgeMs);
    if (isStale && !this.isSyncing) {
      this.syncThemesFromGitHub().catch(() => {});
    }
  }

  /**
   * Descarga e inyecta el user.css de un tema comunitario si está disponible
   */
  public async loadThemeUserCss(theme: SpicetifyTheme): Promise<boolean> {
    if (!theme.usercssUrl) return false;
    try {
      const res = await fetch(theme.usercssUrl);
      if (!res.ok) return false;
      const css = await res.text();
      this.applyCustomCss(css);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Monitor de Commits (Alternativa a Webhooks para aplicaciones de escritorio)
   * Consulta el último SHA de commit de GitHub para detectar cambios sin necesidad de servidor público
   */
  public async checkForGitHubUpdates(): Promise<{ hasUpdate: boolean; sha?: string; message?: string }> {
    try {
      const res = await fetch('https://api.github.com/repos/spicetify/spicetify-themes/commits/master');
      if (!res.ok) return { hasUpdate: false };
      const data = await res.json();
      const sha = data.sha?.slice(0, 7);
      const message = data.commit?.message?.split('\n')[0] || '';
      const date = data.commit?.author?.date || '';

      const isDifferent = Boolean(this.lastCommitSha && sha && this.lastCommitSha !== sha);
      this.lastCommitSha = sha;
      this.lastCommitMessage = message;
      this.lastCommitDate = date;

      try {
        if (sha) localStorage.setItem(SPICE_STORAGE_COMMIT_SHA, sha);
        if (message) localStorage.setItem(SPICE_STORAGE_COMMIT_MSG, message);
        if (date) localStorage.setItem(SPICE_STORAGE_COMMIT_DATE, date);
      } catch {}

      this.notify();

      if (isDifferent) {
        await this.syncThemesFromGitHub();
        return { hasUpdate: true, sha, message };
      }

      return { hasUpdate: false, sha, message };
    } catch {
      return { hasUpdate: false };
    }
  }

  public getLastCommitInfo() {
    return {
      sha: this.lastCommitSha,
      message: this.lastCommitMessage,
      date: this.lastCommitDate
    };
  }

  public getCurrentThemeId(): string {
    return this.currentThemeId;
  }

  public getCurrentSchemeName(): string {
    return this.currentSchemeName;
  }

  public getCustomCss(): string {
    return this.customCss;
  }

  /**
   * Aplica un esquema Spicetify inyectando todas las variables CSS oficiales --spice-* en el :root
   */
  public applyScheme(scheme: SpicetifyColorScheme) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const c = scheme.colors;

    const formatColor = (val: string) => {
      if (!val) return '#121212';
      return val.startsWith('#') ? val : `#${val}`;
    };

    root.style.setProperty('--spice-main', formatColor(c.main));
    root.style.setProperty('--spice-sidebar', formatColor(c.sidebar));
    root.style.setProperty('--spice-player', formatColor(c.player));
    root.style.setProperty('--spice-card', formatColor(c.card));
    root.style.setProperty('--spice-shadow', formatColor(c.shadow));
    root.style.setProperty('--spice-selected-row', formatColor(c.selectedRow));
    root.style.setProperty('--spice-button', formatColor(c.button));
    root.style.setProperty('--spice-button-active', formatColor(c.buttonActive));
    root.style.setProperty('--spice-button-disabled', formatColor(c.buttonDisabled));
    root.style.setProperty('--spice-tab-active', formatColor(c.tabActive));
    root.style.setProperty('--spice-text', formatColor(c.text));
    root.style.setProperty('--spice-subtext', formatColor(c.subtext));
    root.style.setProperty('--spice-notification', formatColor(c.notification));
    root.style.setProperty('--spice-notification-error', formatColor(c.notificationError));
    root.style.setProperty('--spice-misc', formatColor(c.misc));

    // Compatibilidad con las variables de Harmonia
    root.style.setProperty('--accent', formatColor(c.button));
    root.style.setProperty('--accent-hover', formatColor(c.buttonActive));
    root.style.setProperty('--surface-base', formatColor(c.main));
    root.style.setProperty('--surface-highlight', formatColor(c.card));
    root.style.setProperty('--surface-hover', formatColor(c.selectedRow));
    root.style.setProperty('--text-primary', formatColor(c.text));
    root.style.setProperty('--text-secondary', formatColor(c.subtext));

    this.currentSchemeName = scheme.name;
    try {
      localStorage.setItem(SPICE_STORAGE_SCHEME, scheme.name);
    } catch {}
  }

  public setThemeAndScheme(themeId: string, schemeName?: string) {
    const theme = this.getTheme(themeId);
    if (!theme) return;

    this.currentThemeId = themeId;
    const targetSchemeName = schemeName || theme.activeScheme || theme.schemes[0].name;
    const scheme = theme.schemes.find((s) => s.name === targetSchemeName) || theme.schemes[0];

    this.applyScheme(scheme);

    try {
      localStorage.setItem(SPICE_STORAGE_THEME, themeId);
      localStorage.setItem(SPICE_STORAGE_SCHEME, scheme.name);
    } catch {}
  }

  /**
   * Inyecta código CSS de usuario (user.css) directamente en el DOM
   */
  public applyCustomCss(cssContent: string) {
    if (typeof document === 'undefined') return;
    this.customCss = cssContent;

    let styleTag = document.getElementById('spicetify-custom-user-css') as HTMLStyleElement | null;
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'spicetify-custom-user-css';
      document.head.appendChild(styleTag);
    }

    styleTag.textContent = cssContent;

    try {
      localStorage.setItem(SPICE_STORAGE_CUSTOM_CSS, cssContent);
    } catch {}
  }

  /**
   * Parser que procesa cualquier texto en formato color.ini oficial de Spicetify
   */
  public parseColorIni(iniText: string): SpicetifyColorScheme[] {
    const lines = iniText.split(/\r?\n/);
    const schemes: SpicetifyColorScheme[] = [];
    let currentScheme: SpicetifyColorScheme | null = null;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith(';') || line.startsWith('#')) continue;

      if (line.startsWith('[') && line.endsWith(']')) {
        const schemeName = line.slice(1, -1).trim();
        currentScheme = {
          name: schemeName,
          colors: {
            text: '#ffffff',
            subtext: '#b3b3b3',
            main: '#121212',
            sidebar: '#000000',
            player: '#181818',
            card: '#282828',
            shadow: '#000000',
            selectedRow: '#2a2a2a',
            button: '#1db954',
            buttonActive: '#1ed760',
            buttonDisabled: '#535353',
            tabActive: '#1db954',
            notification: '#1db954',
            notificationError: '#e91429',
            misc: '#7f7f7f'
          }
        };
        schemes.push(currentScheme);
        continue;
      }

      if (currentScheme && line.includes('=')) {
        const [rawKey, rawVal] = line.split('=');
        const key = rawKey.trim().toLowerCase().replace(/-/g, '');
        let val = rawVal.trim().split(/\s+/)[0]; // Tomar el primer token en caso de comentarios en línea
        if (!val.startsWith('#') && /^[0-9A-Fa-f]{6}$/.test(val)) {
          val = `#${val}`;
        }

        switch (key) {
          case 'text': currentScheme.colors.text = val; break;
          case 'subtext': currentScheme.colors.subtext = val; break;
          case 'main': currentScheme.colors.main = val; break;
          case 'sidebar': currentScheme.colors.sidebar = val; break;
          case 'player': currentScheme.colors.player = val; break;
          case 'card': currentScheme.colors.card = val; break;
          case 'shadow': currentScheme.colors.shadow = val; break;
          case 'selectedrow': currentScheme.colors.selectedRow = val; break;
          case 'button': currentScheme.colors.button = val; break;
          case 'buttonactive': currentScheme.colors.buttonActive = val; break;
          case 'buttondisabled': currentScheme.colors.buttonDisabled = val; break;
          case 'tabactive': currentScheme.colors.tabActive = val; break;
          case 'notification': currentScheme.colors.notification = val; break;
          case 'notificationerror': currentScheme.colors.notificationError = val; break;
          case 'misc': currentScheme.colors.misc = val; break;
        }
      }
    }

    return schemes;
  }
}

export const spicetifyEngine = new SpicetifyThemeEngine();
