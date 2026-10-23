import { signalEngine } from './SignalEngine';

export interface SoundCapsuleArtist {
  name: string;
  score: number;
  rank: number;
  percentage: number;
}

export interface MusicalArchetype {
  id: string;
  title: string;
  tagline: string;
  description: string;
  gradient: string;
  icon: string;
  traits: string[];
  accentColor: string;
}

export interface SoundCapsuleData {
  totalMinutes: number;
  totalPlays: number;
  totalSkips: number;
  satisfactionRate: number;
  topArtists: SoundCapsuleArtist[];
  peakListeningTime: string;
  archetype: MusicalArchetype;
  shareableSummary: string;
}

export class SoundCapsuleService {
  /**
   * Genera el informe completo de la Cápsula de Sonido (Harmonia Wrapped)
   * basado en la telemetría local acumulada en SignalEngine.
   */
  public generateCapsuleData(): SoundCapsuleData {
    const profile = signalEngine.getTasteProfile();
    const topRaw = signalEngine.getTopArtists(5);
    const hourly = signalEngine.getHourlyDistribution();

    let totalPlays = profile.totalPlays;
    let totalSkips = profile.totalSkips;
    let totalMinutes = signalEngine.getTotalListenedMinutes();

    // Si el usuario es nuevo o tiene muy pocas canciones, aportamos datos amigables
    // basados en las canciones de ejemplo recientes para que el Wrapped siempre luzca vivo
    if (totalPlays === 0 && topRaw.length === 0) {
      totalPlays = 14;
      totalSkips = 2;
      totalMinutes = 48;
    }

    const totalActions = totalPlays + totalSkips;
    const satisfactionRate = totalActions > 0 ? Math.round((totalPlays / totalActions) * 100) : 100;

    // Calcular porcentaje de devoción a cada artista
    const totalScore = topRaw.reduce((acc, a) => acc + a.score, 0) || 1;
    let topArtists: SoundCapsuleArtist[] = topRaw.map((a, idx) => ({
      name: a.artist.charAt(0).toUpperCase() + a.artist.slice(1),
      score: Math.round(a.score * 10) / 10,
      rank: idx + 1,
      percentage: Math.min(100, Math.max(10, Math.round((a.score / totalScore) * 100)))
    }));

    if (topArtists.length === 0) {
      topArtists = [
        { name: 'Omar Courtz', score: 12.5, rank: 1, percentage: 38 },
        { name: 'Bad Bunny', score: 9.2, rank: 2, percentage: 28 },
        { name: 'The Weeknd', score: 6.8, rank: 3, percentage: 20 },
        { name: 'Daft Punk', score: 4.5, rank: 4, percentage: 14 }
      ];
    }

    // Calcular horario pico
    const nightPlays = (hourly[22] || 0) + (hourly[23] || 0) + (hourly[0] || 0) + (hourly[1] || 0) + (hourly[2] || 0) + (hourly[3] || 0) + (hourly[4] || 0) + (hourly[5] || 0);
    const morningPlays = (hourly[6] || 0) + (hourly[7] || 0) + (hourly[8] || 0) + (hourly[9] || 0) + (hourly[10] || 0) + (hourly[11] || 0);
    const afternoonPlays = (hourly[12] || 0) + (hourly[13] || 0) + (hourly[14] || 0) + (hourly[15] || 0) + (hourly[16] || 0) + (hourly[17] || 0) + (hourly[18] || 0) + (hourly[19] || 0) + (hourly[20] || 0) + (hourly[21] || 0);

    let peakListeningTime = 'Tarde (14:00 - 20:00)';
    if (nightPlays >= morningPlays && nightPlays >= afternoonPlays) {
      peakListeningTime = 'Noche (22:00 - 05:00)';
    } else if (morningPlays >= afternoonPlays) {
      peakListeningTime = 'Mañana (07:00 - 12:00)';
    }

    // Determinar Arquetipo Musical
    const archetype = this.computeArchetype(
      satisfactionRate,
      totalSkips,
      topArtists,
      peakListeningTime
    );

    // Resumen para portapapeles
    const shareableSummary = this.buildShareableSummary(
      archetype,
      totalMinutes,
      totalPlays,
      satisfactionRate,
      topArtists,
      peakListeningTime
    );

    return {
      totalMinutes,
      totalPlays,
      totalSkips,
      satisfactionRate,
      topArtists,
      peakListeningTime,
      archetype,
      shareableSummary
    };
  }

  private computeArchetype(
    satisfactionRate: number,
    totalSkips: number,
    topArtists: SoundCapsuleArtist[],
    peakTime: string
  ): MusicalArchetype {
    // 1. Audiófilo Nocturno
    if (peakTime.includes('Noche')) {
      return {
        id: 'nocturnal',
        title: 'Audiófilo Nocturno',
        tagline: 'La noche es tu templo sónico.',
        description:
          'Tus mejores sesiones musicales cobran vida cuando el mundo descansa. Buscas atmósferas inmersivas, ritmos envolventes y una conexión íntima con cada producción.',
        gradient: 'from-indigo-600 via-purple-700 to-slate-900',
        icon: 'moon',
        traits: ['Escucha en penumbra', 'Fidelidad al detalle', 'Conexión emocional'],
        accentColor: '#818cf8'
      };
    }

    // 2. El Purista Fiel
    if (topArtists.length > 0 && topArtists[0].percentage >= 45) {
      return {
        id: 'purist',
        title: 'El Purista Fiel',
        tagline: 'Lealtad sonora inquebrantable.',
        description:
          `Tu devoción por ${topArtists[0].name} es indiscutible. No necesitas mil artistas cuando has encontrado la frecuencia exacta que te define.`,
        gradient: 'from-emerald-600 via-teal-700 to-slate-950',
        icon: 'crown',
        traits: ['Máxima fidelidad', 'Discos completos', 'Afinidad enfocada'],
        accentColor: '#10b981'
      };
    }

    // 3. Devoto del Ritmo
    if (satisfactionRate >= 80) {
      return {
        id: 'rhythm_devotee',
        title: 'Devoto del Ritmo',
        tagline: 'Cada segundo cuenta, cada compás se respeta.',
        description:
          'Rara vez te apresuras a presionar skip. Superas la regla de los 30 segundos de Spotify con creces y le das a cada tema el tiempo necesario para conquistar tus oídos.',
        gradient: 'from-amber-500 via-orange-600 to-stone-900',
        icon: 'flame',
        traits: ['Paciencia musical', 'Tasa de retención > 80%', 'Amor por el ritmo'],
        accentColor: '#f59e0b'
      };
    }

    // 4. El Crítico Exigente
    if (satisfactionRate < 55 && totalSkips > 3) {
      return {
        id: 'exigent_critic',
        title: 'El Crítico Exigente',
        tagline: 'Solo lo extraordinario tiene pase libre.',
        description:
          'Tu tiempo es oro y tu oído no tolera mediocridades. Si una pista no te atrapa en los primeros compases, el botón siguiente actúa sin piedad.',
        gradient: 'from-rose-600 via-pink-700 to-neutral-900',
        icon: 'zap',
        traits: ['Criterio afilado', 'Skip táctico', 'Búsqueda de la excelencia'],
        accentColor: '#f43f5e'
      };
    }

    // 5. Explorador Urbano / Sónico (Default activo)
    return {
      id: 'urban_explorer',
      title: 'Explorador Urbano',
      tagline: 'Vanguardia, bajos potentes y flow constante.',
      description:
        'Tu biblioteca está en constante movimiento. Fusionas el reggaeton de vanguardia con ritmos globales y descubrimientos algorítmicos que marcan el paso de tu día.',
      gradient: 'from-cyan-600 via-blue-700 to-slate-900',
      icon: 'compass',
      traits: ['Flow constante', 'Amplitud de géneros', 'Curiosidad musical'],
      accentColor: '#06b6d4'
    };
  }

  private buildShareableSummary(
    archetype: MusicalArchetype,
    totalMinutes: number,
    totalPlays: number,
    satisfactionRate: number,
    topArtists: SoundCapsuleArtist[],
    peakTime: string
  ): string {
    const artistsList = topArtists
      .slice(0, 5)
      .map((a) => `  #${a.rank} ${a.name} (${a.percentage}%)`)
      .join('\n');

    return `Harmonia Wrapped • Mi Cápsula de Sonido
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Arquetipo: ${archetype.title}
"${archetype.tagline}"

• Tiempo escuchado: ${totalMinutes} minutos (${totalPlays} canciones)
• Tasa de Satisfacción: ${satisfactionRate}% (Superando la regla de 30s)
• Momento Cumbre: ${peakTime}

Top Artistas:
${artistsList}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Harmonia Desktop • Open Source Music`;
  }
}

export const soundCapsuleService = new SoundCapsuleService();
