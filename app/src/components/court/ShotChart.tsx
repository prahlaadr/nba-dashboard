'use client';

import { useState, useMemo } from 'react';
import Court from './Court';
import { transformShots } from '@/lib/transformers/shotChart';
import type { ShotEvent, GameMeta } from '@/types/nba';
import { getTeamColors } from '@/lib/teamColors';
import { useDashboardStore } from '@/store/dashboardStore';

interface ShotChartProps {
  shots: ShotEvent[];
  meta: GameMeta;
}

interface Tooltip {
  x: number;
  y: number;
  shot: ShotEvent;
}

export default function ShotChart({ shots, meta }: ShotChartProps) {
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const { teamFilter, setTeamFilter } = useDashboardStore();

  const homeColors = getTeamColors(meta.homeTeam.abbreviation);
  const awayColors = getTeamColors(meta.awayTeam.abbreviation);

  const teamColorMap = useMemo(
    () => ({
      [meta.homeTeam.teamId]: homeColors.primary,
      [meta.awayTeam.teamId]: awayColors.primary,
    }),
    [meta.homeTeam.teamId, meta.awayTeam.teamId, homeColors.primary, awayColors.primary]
  );

  const transformed = useMemo(
    () => transformShots(shots, teamFilter, teamColorMap),
    [shots, teamFilter, teamColorMap]
  );

  const madeCount = transformed.filter((s) => s.made).length;
  const totalCount = transformed.length;

  return (
    <div>
      {/* Team filter toggles */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => setTeamFilter(null)}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            teamFilter === null
              ? 'bg-white/20 text-white'
              : 'bg-white/5 text-white/50 hover:text-white/80'
          }`}
        >
          Both
        </button>
        <button
          onClick={() => setTeamFilter(meta.awayTeam.teamId)}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors`}
          style={{
            backgroundColor:
              teamFilter === meta.awayTeam.teamId
                ? awayColors.primary
                : 'rgba(255,255,255,0.05)',
            color:
              teamFilter === meta.awayTeam.teamId
                ? '#fff'
                : 'rgba(255,255,255,0.5)',
          }}
        >
          {meta.awayTeam.abbreviation}
        </button>
        <button
          onClick={() => setTeamFilter(meta.homeTeam.teamId)}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors`}
          style={{
            backgroundColor:
              teamFilter === meta.homeTeam.teamId
                ? homeColors.primary
                : 'rgba(255,255,255,0.05)',
            color:
              teamFilter === meta.homeTeam.teamId
                ? '#fff'
                : 'rgba(255,255,255,0.5)',
          }}
        >
          {meta.homeTeam.abbreviation}
        </button>
        <span className="text-white/40 text-sm ml-auto">
          {madeCount}/{totalCount} FG ({totalCount > 0 ? ((madeCount / totalCount) * 100).toFixed(1) : 0}%)
        </span>
      </div>

      <div className="relative">
        <Court>
          {(mapper) => (
            <g>
              {transformed.map((shot) => {
                const cx = mapper.x(shot.locX);
                const cy = mapper.y(shot.locY);
                const radius = Math.max(3, Math.min(6, shot.shotDistance / 5 + 2));

                return (
                  <circle
                    key={shot.gameEventId}
                    cx={cx}
                    cy={cy}
                    r={radius}
                    fill={shot.made ? shot.teamColor : 'none'}
                    stroke={shot.teamColor}
                    strokeWidth={shot.made ? 0 : 1.5}
                    opacity={shot.made ? 0.8 : 0.5}
                    className="cursor-pointer transition-opacity"
                    onMouseEnter={(e) => {
                      const svg = e.currentTarget.closest('svg');
                      if (!svg) return;
                      const pt = svg.createSVGPoint();
                      pt.x = cx;
                      pt.y = cy;
                      setTooltip({ x: cx, y: cy, shot });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })}
            </g>
          )}
        </Court>

        {/* Tooltip overlay */}
        {tooltip && (
          <div
            className="absolute pointer-events-none bg-slate-900/95 border border-white/20 rounded px-3 py-2 text-xs text-white z-10 min-w-[160px]"
            style={{
              left: `${((tooltip.x + 10) / 520) * 100}%`,
              top: `${((tooltip.y - 40) / 490) * 100}%`,
            }}
          >
            <div className="font-semibold">{tooltip.shot.playerName}</div>
            <div className="text-white/60">{tooltip.shot.actionType}</div>
            <div className="text-white/60">
              {tooltip.shot.shotDistance}ft — {tooltip.shot.made ? 'Made' : 'Missed'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
