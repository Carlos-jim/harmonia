import { create } from 'zustand';
import { IMusicProvider } from '../contracts/provider';
import { providerManager } from '../services/providers/ProviderManager';
import { SubsonicConfig } from '../services/subsonic';

export type ProviderMode = 'youtube' | 'audius' | 'subsonic' | 'demo';

/**
 * Dependency Inversion (DIP) & Open/Closed (OCP):
 * El store administra la conexión a través de la abstracción IMusicProvider
 * delegando la instanciación al ProviderManager.
 */
interface ServerState {
  serverUrl: string;
  username: string;
  password: string;
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  activeMode: ProviderMode;
  provider: IMusicProvider;

  // Actions
  connectSubsonic: (config: SubsonicConfig) => Promise<boolean>;
  enableYouTubeMode: () => void;
  enableAudiusMode: () => void;
  enableDemoMode: () => void;
  disconnect: () => void;
  init: () => Promise<void>;
}

const STORAGE_KEY = 'harmonia_server_config';
const MODE_STORAGE_KEY = 'harmonia_active_mode';

export const useServerStore = create<ServerState>((set, get) => ({
  serverUrl: '',
  username: '',
  password: '',
  isConnected: false,
  isConnecting: false,
  connectionError: null,
  activeMode: 'youtube',
  provider: providerManager.getProvider(),

  connectSubsonic: async (config: SubsonicConfig) => {
    set({ isConnecting: true, connectionError: null });

    try {
      const provider = providerManager.setSubsonicProvider(config);
      const isOk = await provider.ping();

      if (isOk) {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            serverUrl: config.serverUrl,
            username: config.username,
            password: config.password
          })
        );
        localStorage.setItem(MODE_STORAGE_KEY, 'subsonic');

        set({
          serverUrl: config.serverUrl,
          username: config.username,
          password: config.password || '',
          isConnected: true,
          isConnecting: false,
          activeMode: 'subsonic',
          connectionError: null,
          provider
        });
        return true;
      } else {
        get().enableYouTubeMode();
        throw new Error('No se pudo verificar el servidor. Revisa la URL y credenciales.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al conectar con el servidor';
      get().enableYouTubeMode();
      set({
        isConnected: false,
        isConnecting: false,
        connectionError: message
      });
      return false;
    }
  },

  enableYouTubeMode: () => {
    const yt = providerManager.setYouTubeProvider();
    localStorage.setItem(MODE_STORAGE_KEY, 'youtube');
    set({
      activeMode: 'youtube',
      isConnected: false,
      provider: yt,
      connectionError: null
    });
  },

  enableAudiusMode: () => {
    const audius = providerManager.setAudiusProvider();
    localStorage.setItem(MODE_STORAGE_KEY, 'audius');
    set({
      activeMode: 'audius',
      isConnected: false,
      provider: audius,
      connectionError: null
    });
  },

  enableDemoMode: () => {
    const demo = providerManager.setDemoProvider();
    localStorage.setItem(MODE_STORAGE_KEY, 'demo');
    set({
      activeMode: 'demo',
      isConnected: false,
      provider: demo,
      connectionError: null
    });
  },

  disconnect: () => {
    localStorage.removeItem(STORAGE_KEY);
    get().enableYouTubeMode();
    set({
      serverUrl: '',
      username: '',
      password: '',
      isConnected: false,
      connectionError: null
    });
  },

  init: async () => {
    const savedMode = localStorage.getItem(MODE_STORAGE_KEY) as ProviderMode | null;

    if (savedMode === 'subsonic') {
      const savedConfig = localStorage.getItem(STORAGE_KEY);
      if (savedConfig) {
        try {
          const parsed = JSON.parse(savedConfig);
          if (parsed.serverUrl && parsed.username) {
            await get().connectSubsonic(parsed);
            return;
          }
        } catch (err) {
          console.warn('Error restoring Subsonic session:', err);
        }
      }
    } else if (savedMode === 'demo') {
      get().enableDemoMode();
      return;
    }

    // Por defecto y para migrar sesiones anteriores: Activar catálogo oficial de YouTube Music
    get().enableYouTubeMode();
  }
}));
