import { Track } from '../../types';

export interface LyricLine {
  time: number; // en segundos con decimales
  text: string;
}

export interface LyricsResult {
  isSynced: boolean;
  lines: LyricLine[];
  plainText?: string;
  instrumental?: boolean;
}

/**
 * Servicio de Letras Sincronizadas (Synced Lyrics Service):
 * Conecta con la API de Lrclib para obtener letras milisegundo a milisegundo en formato .LRC
 * idéntico al sistema de letras a pantalla completa de Spotify Desktop.
 */
export class LyricsService {
  private cache = new Map<string, LyricsResult>();

  private cleanTitle(title: string): string {
    return title
      .replace(/\s*[\(\[](Video Oficial|Official Video|Audio Oficial|Official Audio|Visualizer|Lyric Video|Audio)[\)\]]/gi, '')
      .replace(/\s*\(\(\([^)]+\)\)\)/g, '')
      .replace(/\s*\(feat\.[^)]+\)/gi, '')
      .replace(/\s*\[[^\]]+\]/g, '')
      .replace(/^[^-]+-\s*/, '') // Si dice "Artista - Cancion", dejamos solo la cancion
      .trim();
  }

  private cleanArtist(artist: string): string {
    return artist
      .replace(/ - Topic$/i, '')
      .replace(/ y \d+ más$/i, '')
      .split(/[,&]/)[0] // Tomar el artista principal
      .trim();
  }

  /**
   * Parsea un texto en formato .LRC a una lista ordenada de líneas con tiempo en segundos.
   * Ejemplo: [01:23.45] Letra de la canción -> time: 83.45, text: "Letra de la canción"
   */
  public parseLrc(lrcText: string): LyricLine[] {
    const lines: LyricLine[] = [];
    const regex = /\[(\d{1,2}):(\d{1,2}(?:\.\d{1,3})?)\](.*)/;

    const rawLines = lrcText.split('\n');
    for (const raw of rawLines) {
      const match = raw.match(regex);
      if (match) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseFloat(match[2]);
        const text = match[3].trim();
        const time = minutes * 60 + seconds;
        lines.push({ time, text });
      }
    }

    return lines.sort((a, b) => a.time - b.time);
  }

  /**
   * Obtiene las letras sincronizadas para una canción dada.
   */
  public async getLyrics(track: Track): Promise<LyricsResult> {
    const cacheKey = `${track.artist}::${track.title}`.toLowerCase();
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const cleanedTitle = this.cleanTitle(track.title);
    const cleanedArtist = this.cleanArtist(track.artist);

    try {
      // 1. Intento directo por GET con parámetros exactos
      const directUrl = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(cleanedArtist)}&track_name=${encodeURIComponent(cleanedTitle)}`;
      const res = await fetch(directUrl, {
        headers: { 'User-Agent': 'Harmonia Music Desktop v1.0.0' }
      });

      if (res.ok) {
        const data = await res.json();
        const result = this.processApiResponse(data);
        if (result) {
          this.cache.set(cacheKey, result);
          return result;
        }
      }

      // 2. Fallback: Búsqueda flexible por texto libre
      const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(`${cleanedArtist} ${cleanedTitle}`)}`;
      const searchRes = await fetch(searchUrl, {
        headers: { 'User-Agent': 'Harmonia Music Desktop v1.0.0' }
      });

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (Array.isArray(searchData) && searchData.length > 0) {
          // Priorizamos el primer resultado que tenga letras sincronizadas
          const bestMatch = searchData.find((item) => item.syncedLyrics) || searchData[0];
          const result = this.processApiResponse(bestMatch);
          if (result) {
            this.cache.set(cacheKey, result);
            return result;
          }
        }
      }
    } catch (err) {
      console.warn('Error fetching lyrics from Lrclib:', err);
    }

    // Si no se encontraron letras
    const emptyResult: LyricsResult = {
      isSynced: false,
      lines: [],
      plainText: 'No se encontraron letras disponibles para esta canción.'
    };
    return emptyResult;
  }

  private processApiResponse(data: any): LyricsResult | null {
    if (!data) return null;

    if (data.instrumental) {
      return {
        isSynced: false,
        lines: [],
        instrumental: true,
        plainText: 'Pista Instrumental (Sin letra)'
      };
    }

    if (data.syncedLyrics) {
      const lines = this.parseLrc(data.syncedLyrics);
      if (lines.length > 0) {
        return {
          isSynced: true,
          lines,
          plainText: data.plainLyrics || ''
        };
      }
    }

    if (data.plainLyrics) {
      const fallbackLines = data.plainLyrics
        .split('\n')
        .map((text: string, index: number) => ({
          time: index * 5, // Timestamps sintéticos
          text: text.trim()
        }))
        .filter((l: { text: string }) => l.text.length > 0);

      return {
        isSynced: false,
        lines: fallbackLines,
        plainText: data.plainLyrics
      };
    }

    return null;
  }
}

export const lyricsService = new LyricsService();
