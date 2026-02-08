import type { PbpAction, ScoreMoment } from '@/types/nba';
import { REGULATION_SECONDS, OT_SECONDS } from '@/lib/constants';

/**
 * Parse PBP V3 actions to extract score progression over time.
 *
 * Clock format: "PT11M25.00S" → 11 min, 25 sec remaining in period
 * Q1-Q4: 12 minutes each (720 seconds)
 * OT periods: 5 minutes each (300 seconds)
 *
 * gameSeconds = sum of completed periods + elapsed in current
 */
function periodDuration(period: number): number {
  return period <= 4 ? 720 : 300; // regulation vs OT
}

function periodStartSeconds(period: number): number {
  if (period <= 4) return (period - 1) * 720;
  return REGULATION_SECONDS + (period - 5) * OT_SECONDS;
}

function parseClockToSeconds(clock: string, period: number): number {
  const match = clock.match(/PT(\d+)M([\d.]+)S/);
  if (!match) return periodStartSeconds(period);
  const minutes = parseInt(match[1]);
  const seconds = parseFloat(match[2]);
  const clockRemaining = minutes * 60 + seconds;
  const duration = periodDuration(period);
  return periodStartSeconds(period) + (duration - clockRemaining);
}

export interface ScoreProgressionResult {
  moments: ScoreMoment[];
  totalSeconds: number;
  periods: { label: string; startSeconds: number }[];
}

export function transformScoreProgression(actions: PbpAction[]): ScoreProgressionResult {
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
  let maxPeriod = 4;

  for (const action of actions) {
    const home = parseInt(action.scoreHome) || 0;
    const away = parseInt(action.scoreAway) || 0;

    if (action.period > maxPeriod) maxPeriod = action.period;

    // Only record when score changes
    if (home === lastHome && away === lastAway) continue;

    lastHome = home;
    lastAway = away;

    const gameSeconds = parseClockToSeconds(action.clock, action.period);

    moments.push({
      gameSeconds,
      period: action.period,
      clock: action.clock,
      scoreHome: home,
      scoreAway: away,
      differential: home - away,
      description: action.description,
    });
  }

  const totalSeconds = periodStartSeconds(maxPeriod) + periodDuration(maxPeriod);

  // End of game
  if (moments.length > 0) {
    const last = moments[moments.length - 1];
    if (last.gameSeconds < totalSeconds) {
      moments.push({
        ...last,
        gameSeconds: totalSeconds,
        description: 'Final',
      });
    }
  }

  // Build period markers
  const periods: { label: string; startSeconds: number }[] = [];
  for (let p = 1; p <= maxPeriod; p++) {
    const label = p <= 4 ? `Q${p}` : `OT${p - 4}`;
    periods.push({ label, startSeconds: periodStartSeconds(p) });
  }

  return { moments, totalSeconds, periods };
}
