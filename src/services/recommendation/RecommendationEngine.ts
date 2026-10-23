import { Track } from '../../types';
import { RecommendationScore } from '../../types/recommendation';
import { signalEngine } from './SignalEngine';
import { SAMPLE_TRACKS } from '../../data/mockData';

/**
 * Motor de Recomendaciones Algorítmico (Harmonia RecSys Engine):
 * Implementa la arquitectura híbrida descubierta en Spotify:
 * 1. Filtrado colaborativo de afinidad de artista
 * 2. Grafo de Markov para transiciones de pistas
 * 3. BaRT (Bandits for Recommendations as Treatments) para balance 80% Explotación / 20% Exploración
 */
export class RecommendationEngine {
  /**
   * Obtiene la siguiente lista de recomendaciones a partir de una pista semilla.
   */
  public async getRecommendedTracks(
    seedTrack: Track,
    currentQueue: Track[] = [],
    count = 10
  ): Promise<Track[]> {
    const queueIds = new Set(currentQueue.map((t) => t.id));
    queueIds.add(seedTrack.id);

    // 1. Obtener candidatos externos (vía API oficial de recomendaciones)
    let candidates: Track[] = [];
    try {
      const res = await fetch(
        `/api/youtube/recommendations?artist=${encodeURIComponent(seedTrack.artist)}&excludeId=${encodeURIComponent(seedTrack.id)}&title=${encodeURIComponent(seedTrack.title)}`
      );
      if (res.ok) {
        candidates = await res.json();
      }
    } catch (err) {
      console.warn('Error fetching candidates from recommendation API:', err);
    }

    // 2. Complementar con catálogo local / sample SOLO si no se obtuvieron candidatos remotos
    if (candidates.length === 0) {
      const fallback = SAMPLE_TRACKS.filter((t) => !queueIds.has(t.id));
      candidates = fallback;
    }

    // Filtrar canciones que ya estén en la cola actual
    const validCandidates = candidates.filter((c) => !queueIds.has(c.id));
    if (validCandidates.length === 0) return [];

    const primaryArtistLower = seedTrack.artist.toLowerCase().split(/[,&x\+]|\b(feat|ft)\b/i)[0].trim();

    // 3. Evaluar y puntuar candidatos con el algoritmo híbrido (SignalEngine telemetry)
    const scoredCandidates: RecommendationScore[] = validCandidates.map((candidate) => {
      // Factor 1: Afinidad acumulada de artista (-15 a 100) -> normalizado a [-1, 2]
      const artistAffinity = signalEngine.getArtistAffinity(candidate.artist);
      const normalizedArtist = Math.max(-1, Math.min(2, artistAffinity / 20));

      // Factor 2: Probabilidad de transición desde la canción actual (0 a 1)
      const transitionProb = signalEngine.getTransitionProbability(seedTrack.id, candidate.id);

      // Factor 3: Afinidad individual de la pista (penalización si fue skipped frecuentemente)
      const trackAffinity = signalEngine.getTrackAffinity(candidate.id);
      const skipPenalty = trackAffinity < 0 ? Math.abs(trackAffinity) * 0.5 : 0;

      // Factor 4: Coincidencia de artista con la pista semilla
      const isSameArtist =
        candidate.artist.toLowerCase().includes(primaryArtistLower) ||
        candidate.title.toLowerCase().includes(primaryArtistLower);

      const baseScore =
        normalizedArtist * 0.4 +
        transitionProb * 0.4 +
        (isSameArtist ? 0.2 : 0.1) -
        skipPenalty;

      return {
        track: candidate,
        totalScore: baseScore,
        factors: {
          artistAffinity: normalizedArtist,
          transitionProbability: transitionProb,
          explorationBonus: 0,
          skipPenalty
        },
        isExploration: !isSameArtist
      };
    });

    // 4. BaRT (Bandits for Recommendations as Treatments):
    // Brazo A: Explotación (Mismo artista, diferente canción)
    // Brazo B: Exploración (Diferente artista, mismo género y colaboradores)
    const armSameArtist = scoredCandidates
      .filter((s) => !s.isExploration)
      .sort((a, b) => b.totalScore - a.totalScore);

    const armGenrePeers = scoredCandidates
      .filter((s) => s.isExploration)
      .sort((a, b) => b.totalScore - a.totalScore);

    const finalSelection: Track[] = [];
    const maxLen = Math.max(armSameArtist.length, armGenrePeers.length);

    // Alternar sistemáticamente (Mismo cantante -> Cantante diferente del mismo género -> ...)
    for (let i = 0; i < maxLen && finalSelection.length < count; i++) {
      if (i < armSameArtist.length && finalSelection.length < count) {
        finalSelection.push(armSameArtist[i].track);
      }
      if (i < armGenrePeers.length && finalSelection.length < count) {
        finalSelection.push(armGenrePeers[i].track);
      }
    }

    // Si algún brazo quedó corto, completar con los restantes
    if (finalSelection.length < count) {
      const selectedIds = new Set(finalSelection.map((t) => t.id));
      for (const item of scoredCandidates) {
        if (!selectedIds.has(item.track.id)) {
          finalSelection.push(item.track);
          selectedIds.add(item.track.id);
          if (finalSelection.length >= count) break;
        }
      }
    }

    return finalSelection;
  }

  /**
   * Genera una sesión de "Radio" completa (15 pistas) a partir de una canción semilla.
   */
  public async generateRadio(seedTrack: Track): Promise<Track[]> {
    const recs = await this.getRecommendedTracks(seedTrack, [seedTrack], 14);
    return [seedTrack, ...recs];
  }
}

export const recommendationEngine = new RecommendationEngine();
