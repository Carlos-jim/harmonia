import { Track } from './index';

export type SignalType =
  | 'listen_start'
  | 'listen_completed' // > 30s or finished naturally
  | 'skip_early'       // < 30s
  | 'replay'           // repeated track
  | 'like'             // added to favorites
  | 'unlike';          // removed from favorites

export interface TrackSignalEvent {
  trackId: string;
  artist: string;
  genre?: string;
  timestamp: number;
  duration: number;
  listenedSeconds: number;
  type: SignalType;
}

export interface UserTasteProfile {
  artistAffinities: Record<string, number>; // Accumulated score per artist (-10 to 100)
  trackAffinities: Record<string, number>;  // Accumulated score per trackId (-10 to 100)
  transitionMatrix: Record<string, Record<string, number>>; // Markov graph: [fromTrackId][toTrackId] = count
  totalPlays: number;
  totalSkips: number;
  totalListenedSeconds?: number;
  hourlyPlays?: number[]; // 24 buckets representing hour 0-23
}

export interface RecommendationScore {
  track: Track;
  totalScore: number;
  factors: {
    artistAffinity: number;
    transitionProbability: number;
    explorationBonus: number;
    skipPenalty: number;
  };
  isExploration: boolean;
}
