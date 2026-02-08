import type { PbpAction, ScoreMoment } from '@/types/nba';
import { GAME_LENGTH_SECONDS } from '@/lib/constants';

/**
 * Parse PBP V3 actions to extract score progression over time.
 *
 * Clock format: "PT11M25.00S" → 11 min, 25 sec remaining in period
 * Each period is 12 minutes (720 seconds).
 *
 * gameSeconds = (period - 1) * 720 + (720 - clockSeconds)
 */
function parseClockToSeconds(clock: string, period: number): number {
  const match = clock.match(/PT(\d+)M([\d.]+)S/);
  if (!match) return (period - 1) * 720;
  const minutes = parseInt(match[1]);
  const seconds = parseFloat(match[2]);
  const clockRemaining = minutes * 60 + seconds;
  return (period - 1) * 720 + (720 - clockRemaining);
}

export function transformScoreProgression(actions: PbpAction[]): ScoreMoment[] {
  const moments: ScoreMoment[] = [];

  // Start at 0-0
  moments.push({
    gameSeconds: 0,
    period: 1,
    clock: '12:00',
    scoreHome: 0,
    scoreAway: 0,
    differential: 0,
    description: 'Start',
  });

  let lastHome = 0;
  let lastAway = 0;

  for (const action of actions) {
    const home = parseInt(action.scoreHome) || 0;
    const away = parseInt(action.scoreAway) || 0;

    // Only record when score changes
    if (home === lastHome && away === lastAway) continue;

    lastHome = home;
    lastAway = away;

    const gameSeconds = parseClockToSeconds(action.clock, action.period);

    moments.push({
      gameSeconds: Math.min(gameSeconds, GAME_LENGTH_SECONDS),
      period: action.period,
      clock: action.clock.replace(/PT(\d+)M[\d.]+S/, '$1:00'),
      scoreHome: home,
      scoreAway: away,
      differential: home - away,
      description: action.description,
    });
  }

  // End of game
  if (moments.length > 0) {
    const last = moments[moments.length - 1];
    if (last.gameSeconds < GAME_LENGTH_SECONDS) {
      moments.push({
        ...last,
        gameSeconds: GAME_LENGTH_SECONDS,
        description: 'Final',
      });
    }
  }

  return moments;
}
