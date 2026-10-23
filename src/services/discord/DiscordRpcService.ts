import { Track } from '../../types';

export interface DiscordActivityPayload {
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  currentTime?: number;
  isPlaying: boolean;
  coverUrl?: string;
}

export interface DiscordStatusResponse {
  isConnected: boolean;
  isEnabled: boolean;
  clientId: string;
}

class DiscordRpcService {
  private isEnabled: boolean = true;
  private lastSentHash: string = '';
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('harmonia_discord_rpc_enabled');
      if (stored !== null) {
        this.isEnabled = stored === 'true';
      }
    }
  }

  public async getStatus(): Promise<DiscordStatusResponse> {
    try {
      const res = await fetch('/api/discord/status');
      if (!res.ok) return { isConnected: false, isEnabled: this.isEnabled, clientId: '' };
      const data = await res.json();
      return {
        ...data,
        isEnabled: this.isEnabled
      };
    } catch {
      return { isConnected: false, isEnabled: this.isEnabled, clientId: '' };
    }
  }

  public async setEnabled(enabled: boolean): Promise<void> {
    this.isEnabled = enabled;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('harmonia_discord_rpc_enabled', String(enabled));
    }

    try {
      await fetch('/api/discord/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      if (!enabled) {
        await this.clearActivity();
      }
    } catch {
      // ignore
    }
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  public updateActivity(
    track: Track | null,
    isPlaying: boolean,
    currentTime: number,
    duration: number
  ): void {
    if (!this.isEnabled) return;

    if (!track) {
      this.clearActivity();
      return;
    }

    // Hash rápido para evitar llamadas repetidas innecesarias si nada cambió
    const currentHash = `${track.id}-${isPlaying}-${Math.floor(currentTime / 5)}`;
    if (currentHash === this.lastSentHash) return;
    this.lastSentHash = currentHash;

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(async () => {
      try {
        const payload: DiscordActivityPayload = {
          title: track.title,
          artist: track.artist,
          album: track.album,
          duration: duration || track.duration,
          currentTime,
          isPlaying,
          coverUrl: track.coverUrl
        };

        await fetch('/api/discord/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch {
        // Discord puede no estar abierto o el servidor dev en pausa
      }
    }, 300);
  }

  public async clearActivity(): Promise<void> {
    this.lastSentHash = '';
    try {
      await fetch('/api/discord/clear', { method: 'POST' });
    } catch {
      // ignore
    }
  }
}

export const discordRpcService = new DiscordRpcService();
