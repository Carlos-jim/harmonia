import { IMusicProvider } from '../../contracts/provider';
import { DemoProvider } from './DemoProvider';
import { SubsonicProvider } from './SubsonicProvider';
import { AudiusProvider } from './AudiusProvider';
import { YouTubeProvider } from './YouTubeProvider';
import { SubsonicConfig } from '../subsonic';

/**
 * Open/Closed Principle (OCP) & Dependency Inversion Principle (DIP):
 * Gestor central de proveedores. Administra proveedores conectados
 * (YouTube Music Oficial, Audius Online, Navidrome / Subsonic o Demo Local) sin alterar los componentes.
 */
export class ProviderManager {
  private static instance: ProviderManager;
  private currentProvider: IMusicProvider;
  private youtubeProvider: YouTubeProvider;
  private audiusProvider: AudiusProvider;
  private demoProvider: DemoProvider;

  private constructor() {
    this.youtubeProvider = new YouTubeProvider();
    this.audiusProvider = new AudiusProvider();
    this.demoProvider = new DemoProvider();

    // Por defecto inicia en YouTube Music (Grabaciones de Estudio Oficiales)
    this.currentProvider = this.youtubeProvider;
  }

  static getInstance(): ProviderManager {
    if (!ProviderManager.instance) {
      ProviderManager.instance = new ProviderManager();
    }
    return ProviderManager.instance;
  }

  getProvider(): IMusicProvider {
    return this.currentProvider;
  }

  setYouTubeProvider(): IMusicProvider {
    this.currentProvider = this.youtubeProvider;
    return this.currentProvider;
  }

  setAudiusProvider(): IMusicProvider {
    this.currentProvider = this.audiusProvider;
    return this.currentProvider;
  }

  setDemoProvider(): IMusicProvider {
    this.currentProvider = this.demoProvider;
    return this.currentProvider;
  }

  setSubsonicProvider(config: SubsonicConfig): IMusicProvider {
    this.currentProvider = new SubsonicProvider(config);
    return this.currentProvider;
  }
}

export const providerManager = ProviderManager.getInstance();
