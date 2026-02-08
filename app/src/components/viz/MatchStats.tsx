'use client';

import type { StatGroup, StatRow } from '@/lib/transformers/matchStats';
import type { GameMeta } from '@/types/nba';
import { getTeamColors } from '@/lib/teamColors';

interface MatchStatsProps {
  groups: StatGroup[];
  meta: GameMeta;
}

function formatValue(value: number, format?: 'pct' | 'number'): string {
  if (format === 'pct') return `${value.toFixed(1)}%`;
  return String(Math.round(value));
}

function StatBar({
  row,
  awayColor,
  homeColor,
}: {
  row: StatRow;
  awayColor: string;
  homeColor: string;
}) {
  const maxVal = Math.max(row.away, row.home, 1);

  const awayPct = (row.away / maxVal) * 100;
  const homePct = (row.home / maxVal) * 100;

  const awayLeads = row.away > row.home;
  const homeLeads = row.home > row.away;
  const tied = row.away === row.home;

  return (
    <div className="mb-4">
      {/* Label centered */}
      <div className="text-center text-xs text-gray-400 mb-1.5">{row.label}</div>

      {/* Values + bars */}
      <div className="flex items-center gap-2">
        {/* Away value */}
        <span
          className="w-12 text-right text-sm tabular-nums font-semibold"
          style={{ color: awayLeads || tied ? awayColor : '#d1d5db' }}
        >
          {formatValue(row.away, row.format)}
        </span>

        {/* Bar container */}
        <div className="flex-1 flex h-[10px] gap-[2px]">
          {/* Away bar (right-aligned, grows leftward) */}
          <div className="flex-1 flex justify-end">
            <div
              className="h-full rounded-l-sm transition-all duration-300"
              style={{
                width: `${awayPct}%`,
                backgroundColor: awayLeads || tied ? awayColor : '#e5e7eb',
              }}
            />
          </div>

          {/* Home bar (left-aligned, grows rightward) */}
          <div className="flex-1">
            <div
              className="h-full rounded-r-sm transition-all duration-300"
              style={{
                width: `${homePct}%`,
                backgroundColor: homeLeads || tied ? homeColor : '#e5e7eb',
              }}
            />
          </div>
        </div>

        {/* Home value */}
        <span
          className="w-12 text-left text-sm tabular-nums font-semibold"
          style={{ color: homeLeads || tied ? homeColor : '#d1d5db' }}
        >
          {formatValue(row.home, row.format)}
        </span>
      </div>
    </div>
  );
}

export default function MatchStats({ groups, meta }: MatchStatsProps) {
  const awayColors = getTeamColors(meta.awayTeam.abbreviation);
  const homeColors = getTeamColors(meta.homeTeam.abbreviation);

  const awayColor = awayColors.chart;
  const homeColor = homeColors.chart;

  return (
    <div className="max-w-lg mx-auto">
      {/* Team headers */}
      <div className="flex justify-between mb-5 px-14">
        <span className="text-sm font-bold" style={{ color: awayColor }}>
          {meta.awayTeam.abbreviation}
        </span>
        <span className="text-sm font-bold" style={{ color: homeColor }}>
          {meta.homeTeam.abbreviation}
        </span>
      </div>

      {groups.map((group) => (
        <div key={group.title} className="mb-5">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
            {group.title}
          </div>
          {group.rows.map((row) => (
            <StatBar
              key={row.label}
              row={row}
              awayColor={awayColor}
              homeColor={homeColor}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
