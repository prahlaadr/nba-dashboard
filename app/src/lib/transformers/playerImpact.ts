import type { PlayerBoxScore, PlayerImpactData } from '@/types/nba';

function parseMinutes(min: string): number {
  if (!min) return 0;
  const parts = min.split(':');
  return parseInt(parts[0]) + (parseInt(parts[1] ?? '0') / 60);
}

export function transformPlayerImpact(
  players: PlayerBoxScore[],
  homeTeamId: number,
  awayTeamId: number
): { home: PlayerImpactData[]; away: PlayerImpactData[] } {
  const transform = (teamId: number) =>
    players
      .filter((p) => p.teamId === teamId && p.minutes)
      .map((p) => ({
        playerId: p.playerId,
        playerName: p.playerName,
        teamId: p.teamId,
        teamAbbreviation: p.teamAbbreviation,
        isStarter: p.startPosition !== '',
        minutes: parseMinutes(p.minutes),
        pts: p.pts,
        reb: p.reb,
        ast: p.ast,
        plusMinus: p.plusMinus,
      }))
      .sort((a, b) => b.minutes - a.minutes);

  return {
    home: transform(homeTeamId),
    away: transform(awayTeamId),
  };
}
