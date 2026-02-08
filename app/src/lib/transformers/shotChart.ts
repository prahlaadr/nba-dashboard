import type { ShotEvent } from '@/types/nba';

export interface TransformedShot extends ShotEvent {
  teamColor: string;
}

export function transformShots(
  shots: ShotEvent[],
  teamFilter: number | null,
  teamColors: Record<number, string>
): TransformedShot[] {
  const filtered = teamFilter
    ? shots.filter((s) => s.teamId === teamFilter)
    : shots;

  return filtered.map((shot) => ({
    ...shot,
    teamColor: teamColors[shot.teamId] ?? '#888888',
  }));
}
