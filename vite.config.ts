import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
// @ts-expect-error type error without @types/node package
import process from "node:process";
import { execFile } from "node:child_process";
import path from "node:path";
import net from "node:net";

const host = process.env.TAURI_DEV_HOST;

function youtubeApiPlugin(): Plugin {
  const streamCache = new Map<string, { url: string; time: number }>();
  const ytDlpPath = path.resolve(process.cwd(), 'yt-dlp.exe');

  return {
    name: 'youtube-api-plugin',
    configureServer(server) {
      // Endpoint 1: Búsqueda de canciones oficiales
      server.middlewares.use('/api/youtube/search', async (req, res) => {
        const parsedUrl = new URL(req.url || '', `http://${req.headers.host}`);
        const q = parsedUrl.searchParams.get('q');
        if (!q) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify([]));
          return;
        }

        try {
          const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(q + ' official audio')}`;
          const response = await fetch(ytUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
            }
          });
          const html = await response.text();
          const jsonMatch = html.match(/var ytInitialData = ({.*?});<\/script>/);
          if (!jsonMatch) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify([]));
            return;
          }

          const data = JSON.parse(jsonMatch[1]);
          const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
          const items = contents?.[0]?.itemSectionRenderer?.contents || [];
          const results = [];

          for (const item of items) {
            const v = item.videoRenderer;
            if (v && v.videoId && v.title?.runs?.[0]?.text) {
              const durText = v.lengthText?.simpleText || '3:00';
              const parts = durText.split(':').map(Number);
              const duration = parts.length === 2 ? parts[0] * 60 + parts[1] : parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : 180;
              
              const rawTitle = v.title.runs[0].text;
              const cleanTitle = rawTitle.replace(/\s*[\(\[](Video Oficial|Official Video|Audio Oficial|Official Audio|Visualizer|Lyric Video|Audio)[\)\]]/gi, '').trim();
              const artist = v.ownerText?.runs?.[0]?.text || 'Artista Desconocido';
              const thumb = v.thumbnail?.thumbnails?.[v.thumbnail.thumbnails.length - 1]?.url || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`;

              results.push({
                id: v.videoId,
                title: cleanTitle,
                artist: artist.replace(/ - Topic$/i, '').replace(/ y \d+ más$/i, ''),
                album: 'Grabación Oficial de Estudio',
                duration,
                coverUrl: thumb,
                audioUrl: `youtube://${v.videoId}`,
                genre: 'Música Oficial'
              });
            }
          }

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(results));
        } catch (err) {
          console.error('Error fetching YouTube results:', err);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify([]));
        }
      });

// Grafo de colaboración y afinidad de género (Spotify REA Collaborative Filtering)
const ARTIST_COLLABORATION_MAP: Record<string, string[]> = {
  // Trap Latino / Reggaetón / Urbano
  'yan block': ['Cris MJ', 'Hades66', 'Omar Courtz', 'Luar La L', 'Eladio Carrión', 'Panda Black', 'Dei V', 'Bryant Myers'],
  'cris mj': ['Yan Block', 'FloyyMenor', 'Standly', 'El Jordan 23', 'Omar Courtz', 'Hades66', 'Luar La L', 'Pablo Chill-E'],
  'hades66': ['Yan Block', 'Luar La L', 'Dei V', 'Omar Courtz', 'Yovngchimi', 'CDobleta', 'Eladio Carrión', 'Ñengo Flow'],
  'omar courtz': ['Dei V', 'Yan Block', 'Luar La L', 'Mora', 'Rauw Alejandro', 'Cris MJ', 'Bad Bunny', 'Young Miko'],
  'luar la l': ['Yan Block', 'Hades66', 'Omar Courtz', 'Eladio Carrión', 'Yovngchimi', 'Dei V', 'Anuel AA'],
  'eladio carrión': ['Luar La L', 'Mora', 'Bad Bunny', 'Duki', 'Myke Towers', 'Dei V', 'Hades66', 'Bryant Myers'],
  'eladio carrion': ['Luar La L', 'Mora', 'Bad Bunny', 'Duki', 'Myke Towers', 'Dei V', 'Hades66', 'Bryant Myers'],
  'dei v': ['Omar Courtz', 'Yan Block', 'Mora', 'Cris MJ', 'Luar La L', 'Bad Bunny', 'Yovngchimi'],
  'bad bunny': ['Mora', 'Rauw Alejandro', 'Feid', 'Jhayco', 'Eladio Carrión', 'Arcángel', 'Myke Towers', 'Chencho Corleone'],
  'feid': ['Mora', 'Ryan Castro', 'Blessd', 'Bad Bunny', 'Quevedo', 'Saiko', 'Manuel Turizo', 'Ozuna'],
  'mora': ['Feid', 'Bad Bunny', 'Jhayco', 'Quevedo', 'Rauw Alejandro', 'Eladio Carrión', 'Omar Courtz', 'Dei V'],
  'rauw alejandro': ['Bad Bunny', 'Feid', 'Mora', 'Chencho Corleone', 'Alvaro Diaz', 'Lyanno', 'Ozuna'],
  'myke towers': ['Bad Bunny', 'Eladio Carrión', 'Jhayco', 'Quevedo', 'Mora', 'Anuel AA', 'Ozuna'],
  'anuel aa': ['Ozuna', 'Bad Bunny', 'Bryant Myers', 'Myke Towers', 'Ñengo Flow', 'Luar La L'],
  'duki': ['YSY A', 'Milo J', 'Neo Pistea', 'Khea', 'Bizarrap', 'Tiago PZK', 'Eladio Carrión', 'Lit Killah'],
  'milo j': ['Duki', 'Bizarrap', 'Khea', 'Nicki Nicole', 'YSY A', 'Tiago PZK', 'Wos'],
  'bizarrap': ['Duki', 'Quevedo', 'Milo J', 'Villano Antillano', 'Snow Tha Product', 'Shakira', 'Peso Pluma', 'Young Miko'],
  'peso pluma': ['Junior H', 'Natanael Cano', 'Gabito Ballesteros', 'Fuerza Regida', 'Xavi', 'Tito Double P'],
  'natanael cano': ['Peso Pluma', 'Junior H', 'Gabito Ballesteros', 'Fuerza Regida', 'Oscar Maydon'],
  'junior h': ['Natanael Cano', 'Peso Pluma', 'Gabito Ballesteros', 'Oscar Maydon', 'Fuerza Regida'],
  'the weeknd': ['Post Malone', 'Drake', 'Bruno Mars', 'Travis Scott', 'Kendrick Lamar', 'Daft Punk', 'SZA'],
  'drake': ['21 Savage', 'Travis Scott', 'Future', 'Lil Baby', 'Kendrick Lamar', 'The Weeknd', 'J. Cole'],
  'travis scott': ['Metro Boomin', 'Don Toliver', 'Future', 'Playboi Carti', '21 Savage', 'Drake', 'Lil Uzi Vert'],
  'kendrick lamar': ['Baby Keem', 'J. Cole', 'SZA', 'ScHoolboy Q', 'Drake', 'Future', 'A$AP Rocky'],
  'taylor swift': ['Sabrina Carpenter', 'Olivia Rodrigo', 'Gracie Abrams', 'Lana Del Rey', 'Phoebe Bridgers', 'Lorde'],
  'billie eilish': ['Finneas', 'Olivia Rodrigo', 'Lorde', 'Lana Del Rey', 'Melanie Martinez', 'Girl in Red'],
  'sabrina carpenter': ['Olivia Rodrigo', 'Taylor Swift', 'Tate McRae', 'Chappell Roan', 'Gracie Abrams', 'Dua Lipa'],
  'olivia rodrigo': ['Sabrina Carpenter', 'Billie Eilish', 'Taylor Swift', 'Conan Gray', 'Gracie Abrams', 'Paramore'],
  'dua lipa': ['Doja Cat', 'Ariana Grande', 'Miley Cyrus', 'Bebe Rexha', 'Katy Perry', 'Charli XCX']
};

async function searchYouTubeTracks(query: string, excludeId: string, limit = 10) {
  try {
    const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const response = await fetch(ytUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
      }
    });
    const html = await response.text();
    const jsonMatch = html.match(/var ytInitialData = ({.*?});<\/script>/);
    if (!jsonMatch) return [];

    const data = JSON.parse(jsonMatch[1]);
    const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
    const items = contents?.[0]?.itemSectionRenderer?.contents || [];
    const results = [];

    for (const item of items) {
      const v = item.videoRenderer;
      if (v && v.videoId && v.videoId !== excludeId && v.title?.runs?.[0]?.text) {
        const rawTitle = v.title.runs[0].text;
        // Filtrar mixes de terceros o compilaciones largas
        if (/(\bmix\b|100%|álbum completo|enganchado|set dj)/i.test(rawTitle)) {
          continue;
        }

        const durText = v.lengthText?.simpleText || '3:00';
        const parts = durText.split(':').map(Number);
        const duration = parts.length === 2 ? parts[0] * 60 + parts[1] : 180;
        if (duration > 600 || duration < 40) continue;

        const cleanTitle = rawTitle.replace(/\s*[\(\[](Video Oficial|Official Video|Audio Oficial|Official Audio|Visualizer|Lyric Video|Audio)[\)\]]/gi, '').trim();
        const channel = v.ownerText?.runs?.[0]?.text || '';

        results.push({
          id: v.videoId,
          title: cleanTitle,
          artist: channel.replace(/ - Topic$/i, '').replace(/ y \d+ más$/i, ''),
          album: 'Recomendación Algorítmica',
          duration,
          coverUrl: v.thumbnail?.thumbnails?.[v.thumbnail.thumbnails.length - 1]?.url || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
          audioUrl: `youtube://${v.videoId}`,
          genre: 'Recomendado para ti'
        });

        if (results.length >= limit) break;
      }
    }
    return results;
  } catch (err) {
    console.error('Error fetching YouTube tracks:', err);
    return [];
  }
}

      // Endpoint: Recomendaciones algorítmicas (estilo Spotify Radio / Autoplay)
      server.middlewares.use('/api/youtube/recommendations', async (req, res) => {
        const parsedUrl = new URL(req.url || '', `http://${req.headers.host}`);
        const artist = parsedUrl.searchParams.get('artist') || '';
        const excludeId = parsedUrl.searchParams.get('excludeId') || '';
        const seedTitle = (parsedUrl.searchParams.get('title') || '').toLowerCase().trim();
        
        if (!artist) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify([]));
          return;
        }

        try {
          // Extraer artistas primarios y colaboradores de la cadena del artista
          const rawArtists = artist
            .split(/[,&x\+]|\b(feat\.?|ft\.?|con|with)\b/i)
            .map((s) => (s || '').trim())
            .filter((s) => s.length > 1 && !/^(feat|ft|con|with)$/i.test(s));

          const primaryArtist = rawArtists[0] || artist.trim();
          const coArtists = rawArtists.slice(1);

          // Buscar en el grafo de colaboración de Spotify REA
          const normalizedPrimary = primaryArtist.toLowerCase();
          const mappedPeers = ARTIST_COLLABORATION_MAP[normalizedPrimary] || [];
          
          // Combinar colaboradores directos de la pista + pares del grafo de género
          const relatedArtists = Array.from(new Set([...coArtists, ...mappedPeers]));

          // Disparar en paralelo (Spotify BaRT Pipeline):
          // 1. Pistas del mismo artista (explotación)
          // 2. Pistas de artistas colaboradores o del mismo género (exploración de género)
          const sameArtistPromise = searchYouTubeTracks(`${primaryArtist} canciones official audio`, excludeId, 10);
          
          let relatedArtistPromise;
          if (relatedArtists.length > 0) {
            const topRelated = relatedArtists.slice(0, 3).join(' ');
            relatedArtistPromise = searchYouTubeTracks(`${topRelated} canciones official audio`, excludeId, 10);
          } else {
            relatedArtistPromise = searchYouTubeTracks(`${primaryArtist} radio mix canciones official audio`, excludeId, 10);
          }

          const [sameRaw, relatedRaw] = await Promise.all([sameArtistPromise, relatedArtistPromise]);

          const seenIds = new Set([excludeId]);
          const seenTitles = new Set();
          if (seedTitle) seenTitles.add(seedTitle);

          const isDuplicate = (track: { id: string; title: string }) => {
            if (seenIds.has(track.id)) return true;
            const normTitle = track.title.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (seedTitle && normTitle.includes(seedTitle.replace(/[^a-z0-9]/g, ''))) return true;
            if (seenTitles.has(normTitle)) return true;
            return false;
          };

          // Separar en Grupo A (Mismo Artista) y Grupo B (Diferente Artista, Mismo Género)
          const poolSame: typeof sameRaw = [];
          const poolRelated: typeof sameRaw = [];

          const primaryLower = primaryArtist.toLowerCase();

          for (const track of sameRaw) {
            if (isDuplicate(track)) continue;
            const isSame = track.artist.toLowerCase().includes(primaryLower) || track.title.toLowerCase().includes(primaryLower);
            if (isSame) {
              seenIds.add(track.id);
              seenTitles.add(track.title.toLowerCase().replace(/[^a-z0-9]/g, ''));
              poolSame.push(track);
            } else {
              seenIds.add(track.id);
              seenTitles.add(track.title.toLowerCase().replace(/[^a-z0-9]/g, ''));
              poolRelated.push(track);
            }
          }

          for (const track of relatedRaw) {
            if (isDuplicate(track)) continue;
            seenIds.add(track.id);
            seenTitles.add(track.title.toLowerCase().replace(/[^a-z0-9]/g, ''));
            const isSame = track.artist.toLowerCase().includes(primaryLower) || track.title.toLowerCase().includes(primaryLower);
            if (isSame) {
              poolSame.push(track);
            } else {
              poolRelated.push(track);
            }
          }

          // REA BaRT Interleaving: Alternar estrictamente
          // [Mismo cantante (otra canción), Cantante diferente (mismo género), Mismo cantante, ...]
          const interleaved: typeof sameRaw = [];
          const maxCount = Math.max(poolSame.length, poolRelated.length);

          for (let i = 0; i < maxCount; i++) {
            if (i < poolSame.length) {
              interleaved.push(poolSame[i]);
            }
            if (i < poolRelated.length) {
              interleaved.push(poolRelated[i]);
            }
          }

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(interleaved.slice(0, 16)));
        } catch (err) {
          console.error('Error in recommendations endpoint:', err);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify([]));
        }
      });

      // Endpoint 2: Extracción directa de audio stream para HTML5 Audio (como Spotube)
      server.middlewares.use('/api/youtube/stream', (req, res) => {
        const parsedUrl = new URL(req.url || '', `http://${req.headers.host}`);
        const v = parsedUrl.searchParams.get('v');
        if (!v) {
          res.statusCode = 400;
          res.end('Missing v parameter');
          return;
        }

        const cached = streamCache.get(v);
        if (cached && Date.now() - cached.time < 3600 * 1000) {
          res.writeHead(302, {
            Location: cached.url,
            'Access-Control-Allow-Origin': '*'
          });
          res.end();
          return;
        }

        execFile(ytDlpPath, ['-g', '-f', 'bestaudio', `https://www.youtube.com/watch?v=${v}`], (err, stdout) => {
          if (err) {
            console.error('yt-dlp stream extraction error:', err);
            res.statusCode = 500;
            res.end('Error extracting audio stream');
            return;
          }

          const streamUrl = stdout.trim().split('\n')[0];
          if (streamUrl && streamUrl.startsWith('http')) {
            streamCache.set(v, { url: streamUrl, time: Date.now() });
            res.writeHead(302, {
              Location: streamUrl,
              'Access-Control-Allow-Origin': '*'
            });
            res.end();
          } else {
            res.statusCode = 502;
            res.end('Failed to extract stream url');
          }
        });
      });
    }
  };
}

function discordRpcPlugin(): Plugin {
  let discordSocket: net.Socket | null = null;
  let isConnected = false;
  let isEnabled = true;
  const clientId = '367827983903490050';

  function encodePacket(op: number, data: unknown): Buffer {
    const json = JSON.stringify(data);
    const len = Buffer.byteLength(json);
    const packet = Buffer.alloc(8 + len);
    packet.writeInt32LE(op, 0);
    packet.writeInt32LE(len, 4);
    packet.write(json, 8);
    return packet;
  }

  function connectToDiscord(callback?: (connected: boolean) => void) {
    if (discordSocket && !discordSocket.destroyed) {
      callback?.(isConnected);
      return;
    }

    const isWin = process.platform === 'win32';
    const pipePath = isWin
      ? '\\\\.\\pipe\\discord-ipc-0'
      : `${process.env.XDG_RUNTIME_DIR || process.env.TMPDIR || '/tmp'}/discord-ipc-0`;

    try {
      const socket = net.createConnection(pipePath);

      socket.on('connect', () => {
        socket.write(encodePacket(0, { v: 1, client_id: clientId }));
      });

      socket.on('data', (buf) => {
        if (buf.length < 8) return;
        const op = buf.readInt32LE(0);
        const len = buf.readInt32LE(4);
        if (buf.length >= 8 + len) {
          try {
            const json = JSON.parse(buf.toString('utf8', 8, 8 + len));
            if (json.evt === 'READY') {
              isConnected = true;
              discordSocket = socket;
              callback?.(true);
            }
          } catch {
            // ignore
          }
        }
      });

      socket.on('close', () => {
        isConnected = false;
        discordSocket = null;
      });

      socket.on('error', () => {
        isConnected = false;
        discordSocket = null;
        callback?.(false);
      });
    } catch {
      isConnected = false;
      discordSocket = null;
      callback?.(false);
    }
  }

  // Conectar proactivamente al iniciar el servidor
  connectToDiscord();

  return {
    name: 'discord-rpc-plugin',
    configureServer(server) {
      // Estado de Discord RPC
      server.middlewares.use('/api/discord/status', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ isConnected, isEnabled, clientId }));
      });

      // Alternar activación de Discord RPC
      server.middlewares.use('/api/discord/toggle', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', () => {
            try {
              const data = JSON.parse(body || '{}');
              if (typeof data.enabled === 'boolean') {
                isEnabled = data.enabled;
                if (!isEnabled && discordSocket && isConnected) {
                  discordSocket.write(encodePacket(1, {
                    cmd: 'SET_ACTIVITY',
                    args: { pid: process.pid, activity: null },
                    nonce: `${Date.now()}`
                  }));
                }
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, isEnabled }));
            } catch {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
          });
        } else {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ isEnabled }));
        }
      });

      // Actualizar Actividad en Discord
      server.middlewares.use('/api/discord/activity', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end();
          return;
        }

        let body = '';
        req.on('data', (chunk) => { body += chunk; });
        req.on('end', () => {
          try {
            const data = JSON.parse(body || '{}');
            if (!isEnabled) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, reason: 'disabled' }));
              return;
            }

            const sendActivity = () => {
              if (!discordSocket || !isConnected) {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, reason: 'not_connected' }));
                return;
              }

              const { title, artist, album, duration, currentTime, isPlaying, coverUrl } = data;
              const nowSec = Math.floor(Date.now() / 1000);
              const curTime = typeof currentTime === 'number' ? currentTime : 0;
              const dur = typeof duration === 'number' ? duration : 0;

              const startTimestamp = isPlaying && dur > 0
                ? Math.max(0, nowSec - Math.floor(curTime))
                : undefined;
              const endTimestamp = isPlaying && startTimestamp && dur > 0
                ? startTimestamp + Math.floor(dur)
                : undefined;

              const activityPayload = {
                cmd: 'SET_ACTIVITY',
                args: {
                  pid: process.pid,
                  activity: {
                    details: title ? (title.length > 120 ? title.slice(0, 117) + '...' : title) : 'Reproduciendo en Harmonia',
                    state: artist ? (artist.length > 120 ? artist.slice(0, 117) + '...' : artist) : 'Harmonia Desktop',
                    timestamps: isPlaying && startTimestamp ? { start: startTimestamp, end: endTimestamp } : undefined,
                    assets: {
                      large_image: coverUrl && coverUrl.startsWith('http') ? coverUrl : 'harmonia_logo',
                      large_text: album ? `${album} | Harmonia` : 'Harmonia Desktop Music',
                      small_image: isPlaying ? 'play' : 'pause',
                      small_text: isPlaying ? 'Reproduciendo' : 'En pausa'
                    },
                    buttons: [
                      { label: 'Escuchar en Harmonia', url: 'https://github.com/morluto/rea' }
                    ]
                  }
                },
                nonce: `${Date.now()}`
              };

              discordSocket.write(encodePacket(1, activityPayload));
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            };

            if (!discordSocket || !isConnected) {
              connectToDiscord(() => {
                sendActivity();
              });
            } else {
              sendActivity();
            }
          } catch (e) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: String(e) }));
          }
        });
      });

      // Limpiar Actividad
      server.middlewares.use('/api/discord/clear', (req, res) => {
        if (discordSocket && isConnected) {
          const clearPayload = {
            cmd: 'SET_ACTIVITY',
            args: { pid: process.pid, activity: null },
            nonce: `${Date.now()}`
          };
          discordSocket.write(encodePacket(1, clearPayload));
        }
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true }));
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [react(), tailwindcss(), youtubeApiPlugin(), discordRpcPlugin()],

  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
}));
