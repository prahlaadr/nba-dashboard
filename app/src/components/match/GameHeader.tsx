'use client';

import type { GameMeta } from '@/types/nba';
import { getTeamColors } from '@/lib/teamColors';

interface GameHeaderProps {
  meta: GameMeta;
}

export default function GameHeader({ meta }: GameHeaderProps) {
  const homeColors = getTeamColors(meta.homeTeam.abbreviation);
  const awayColors = getTeamColors(meta.awayTeam.abbreviation);

  return (
    <div className="flex items-center justify-between gap-6 py-4 px-6 rounded-lg bg-white/5 border border-white/10">
      {/* Away team */}
      <div className="flex items-center gap-4 flex-1">
        <div className="text-right flex-1">
          <div className="text-sm text-white/50">{meta.awayTeam.city}</div>
          <div className="text-lg font-bold" style={{ color: awayColors.primary }}>
            {meta.awayTeam.nickname}
          </div>
          <div className="text-xs text-white/30">{meta.awayTeam.record}</div>
        </div>
        <div className="text-4xl font-black tabular-nums" style={{ color: awayColors.primary }}>
          {meta.awayTeam.score}
        </div>
      </div>

      {/* Center info */}
      <div className="text-center px-4">
        <div className="text-xs text-white/40 uppercase tracking-wider">Final</div>
        <div className="text-white/20 text-lg font-light my-1">-</div>
        <div className="text-xs text-white/40">{meta.date}</div>
      </div>

      {/* Home team */}
      <div className="flex items-center gap-4 flex-1">
        <div className="text-4xl font-black tabular-nums" style={{ color: homeColors.primary }}>
          {meta.homeTeam.score}
        </div>
        <div className="flex-1">
          <div className="text-sm text-white/50">{meta.homeTeam.city}</div>
          <div className="text-lg font-bold" style={{ color: homeColors.primary }}>
            {meta.homeTeam.nickname}
          </div>
          <div className="text-xs text-white/30">{meta.homeTeam.record}</div>
        </div>
      </div>
    </div>
  );
}
