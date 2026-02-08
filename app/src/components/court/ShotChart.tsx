'use client';

import { useState, useMemo, useEffect } from 'react';
import Court from './Court';
import HexBinLayer, { type HexHoverInfo } from './HexBinLayer';
import type { ShotEvent, GameMeta, PlayerBoxScore } from '@/types/nba';
import { getTeamColors } from '@/lib/teamColors';
import { useDashboardStore } from '@/store/dashboardStore';

type ViewMode = 'dots' | 'heat';

interface ShotChartProps {
  shots: ShotEvent[];
  meta: GameMeta;
  boxScore: PlayerBoxScore[];
}

interface Tooltip {
  x: number;
  y: number;
  shot: ShotEvent;
}

export default function ShotChart({ shots, meta, boxScore }: ShotChartProps) {
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const [hexTooltip, setHexTooltip] = useState<HexHoverInfo | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('dots');
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const { teamFilter, setTeamFilter } = useDashboardStore();

  const homeColors = getTeamColors(meta.homeTeam.abbreviation);
  const awayColors = getTeamColors(meta.awayTeam.abbreviation);

  useEffect(() => setSelectedPlayer(null), [teamFilter]);

  const teamFiltered = useMemo(
    () => (teamFilter ? shots.filter((s) => s.teamId === teamFilter) : shots),
    [shots, teamFilter]
  );

  const filtered = useMemo(
    () => selectedPlayer ? teamFiltered.filter((s) => s.playerName === selectedPlayer) : teamFiltered,
    [teamFiltered, selectedPlayer]
  );

  // Players for the selected team, sorted by shot count descending
  const teamPlayers = useMemo(() => {
    if (!teamFilter) return [];
    const counts = new Map<string, number>();
    for (const s of teamFiltered) {
      counts.set(s.playerName, (counts.get(s.playerName) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);
  }, [teamFiltered, teamFilter]);

  const chartColorMap = useMemo(
    () => ({
      [meta.homeTeam.teamId]: homeColors.chart,
      [meta.awayTeam.teamId]: awayColors.chart,
    }),
    [meta.homeTeam.teamId, meta.awayTeam.teamId, homeColors.chart, awayColors.chart]
  );

  const madeCount = filtered.filter((s) => s.made).length;
  const totalCount = filtered.length;

  return (
    <div>
      {/* Header row: team filter + stats + legend */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <button
          onClick={() => setTeamFilter(null)}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            teamFilter === null
              ? 'bg-gray-200 text-gray-900'
              : 'bg-gray-100 text-gray-500 hover:text-gray-700'
          }`}
        >
          Both
        </button>
        <button
          onClick={() => setTeamFilter(meta.awayTeam.teamId)}
          className="px-3 py-1 rounded text-sm font-medium transition-colors"
          style={{
            backgroundColor:
              teamFilter === meta.awayTeam.teamId
                ? awayColors.primary
                : '#f3f4f6',
            color:
              teamFilter === meta.awayTeam.teamId
                ? '#fff'
                : '#6b7280',
          }}
        >
          {meta.awayTeam.abbreviation}
        </button>
        <button
          onClick={() => setTeamFilter(meta.homeTeam.teamId)}
          className="px-3 py-1 rounded text-sm font-medium transition-colors"
          style={{
            backgroundColor:
              teamFilter === meta.homeTeam.teamId
                ? homeColors.primary
                : '#f3f4f6',
            color:
              teamFilter === meta.homeTeam.teamId
                ? '#fff'
                : '#6b7280',
          }}
        >
          {meta.homeTeam.abbreviation}
        </button>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 ml-2 border-l border-gray-200 pl-2">
          {(['dots', 'heat'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === mode
                  ? 'bg-gray-200 text-gray-900'
                  : 'bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
            >
              {mode === 'dots' ? 'Dots' : 'Heat'}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 ml-auto text-xs text-gray-400">
          {viewMode === 'dots' ? (
            <>
              <span className="flex items-center gap-1">
                <svg width="10" height="10">
                  <circle cx="5" cy="5" r="4" fill="#888" />
                </svg>
                Made
              </span>
              <span className="flex items-center gap-1">
                <svg width="10" height="10">
                  <line x1="1" y1="1" x2="9" y2="9" stroke="#888" strokeWidth="1.5" />
                  <line x1="9" y1="1" x2="1" y2="9" stroke="#888" strokeWidth="1.5" />
                </svg>
                Missed
              </span>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1">
                <svg width="60" height="10">
                  <defs>
                    <linearGradient id="hex-legend-gradient">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="50%" stopColor="#94a3b8" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                  </defs>
                  <rect width="60" height="10" rx="2" fill="url(#hex-legend-gradient)" />
                </svg>
              </span>
              <span className="text-gray-400">Cold</span>
              <span className="text-gray-400">Hot</span>
            </>
          )}
          <span className="text-gray-500 font-medium">
            {madeCount}/{totalCount} FG (
            {totalCount > 0
              ? ((madeCount / totalCount) * 100).toFixed(1)
              : 0}
            %)
          </span>
        </div>
      </div>

      <div className="relative">
        <Court>
          {(mapper) => (
            <g>
              {viewMode === 'dots' ? (
                <>
                  {/* Render missed shots first (behind), then made shots on top */}
                  {filtered
                    .slice()
                    .sort((a, b) => (a.made === b.made ? 0 : a.made ? 1 : -1))
                    .map((shot) => {
                      const sx = mapper.x(shot.locX);
                      const sy = mapper.y(shot.locY);
                      const color = chartColorMap[shot.teamId] ?? '#888';
                      const r = 5;

                      if (shot.made) {
                        return (
                          <circle
                            key={shot.gameEventId}
                            cx={sx}
                            cy={sy}
                            r={r}
                            fill={color}
                            fillOpacity={0.85}
                            stroke={color}
                            strokeWidth={1}
                            strokeOpacity={0.4}
                            className="cursor-pointer"
                            onMouseEnter={() =>
                              setTooltip({ x: sx, y: sy, shot })
                            }
                            onMouseLeave={() => setTooltip(null)}
                          />
                        );
                      }

                      // Missed shot: X mark
                      const s = r * 0.7;
                      return (
                        <g
                          key={shot.gameEventId}
                          className="cursor-pointer"
                          onMouseEnter={() =>
                            setTooltip({ x: sx, y: sy, shot })
                          }
                          onMouseLeave={() => setTooltip(null)}
                        >
                          <line
                            x1={sx - s}
                            y1={sy - s}
                            x2={sx + s}
                            y2={sy + s}
                            stroke={color}
                            strokeWidth={1.5}
                            strokeOpacity={0.5}
                          />
                          <line
                            x1={sx + s}
                            y1={sy - s}
                            x2={sx - s}
                            y2={sy + s}
                            stroke={color}
                            strokeWidth={1.5}
                            strokeOpacity={0.5}
                          />
                        </g>
                      );
                    })}
                </>
              ) : (
                <HexBinLayer
                  shots={filtered}
                  mapper={mapper}
                  onHexHover={setHexTooltip}
                />
              )}
            </g>
          )}
        </Court>

        {/* Dot tooltip */}
        {viewMode === 'dots' && tooltip && (
          <div
            className="absolute pointer-events-none bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 z-10 min-w-[160px] shadow-lg"
            style={{
              left: `${((tooltip.x + 15) / 520) * 100}%`,
              top: `${((tooltip.y - 45) / 490) * 100}%`,
            }}
          >
            <div className="font-semibold">{tooltip.shot.playerName}</div>
            <div className="text-gray-500">{tooltip.shot.actionType}</div>
            <div className="text-gray-500">
              {tooltip.shot.shotDistance}ft —{' '}
              <span
                className={
                  tooltip.shot.made ? 'text-green-600' : 'text-red-500'
                }
              >
                {tooltip.shot.made ? 'Made' : 'Missed'}
              </span>
            </div>
          </div>
        )}

        {/* Hex tooltip */}
        {viewMode === 'heat' && hexTooltip && (
          <div
            className="absolute pointer-events-none bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 z-10 min-w-[120px] shadow-lg"
            style={{
              left: `${((hexTooltip.x + 15) / 520) * 100}%`,
              top: `${((hexTooltip.y - 45) / 490) * 100}%`,
            }}
          >
            <div className="font-semibold">
              {(hexTooltip.fgPct * 100).toFixed(1)}% FG
            </div>
            <div className="text-gray-500">
              {hexTooltip.makes}/{hexTooltip.attempts} shots
            </div>
          </div>
        )}
      </div>

      {/* Player filter chips */}
      {teamFilter && teamPlayers.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {teamPlayers.map((name) => {
            const active = selectedPlayer === name;
            const color = teamFilter === meta.homeTeam.teamId ? homeColors.chart : awayColors.chart;
            return (
              <button
                key={name}
                onClick={() => setSelectedPlayer(active ? null : name)}
                className="px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
                style={{
                  backgroundColor: active ? color : '#f3f4f6',
                  color: active ? '#fff' : '#6b7280',
                }}
              >
                {name}
              </button>
            );
          })}
        </div>
      )}

      {/* Selected player stats */}
      {selectedPlayer && (() => {
        const p = boxScore.find((b) => b.playerName === selectedPlayer);
        if (!p) return null;
        const color = teamFilter === meta.homeTeam.teamId ? homeColors.chart : awayColors.chart;
        const stats = [
          { label: 'PTS', value: p.pts },
          { label: 'REB', value: p.reb },
          { label: 'AST', value: p.ast },
          { label: 'FG', value: `${p.fgm}/${p.fga}` },
          { label: '3PT', value: `${p.fg3m}/${p.fg3a}` },
          { label: 'FT', value: `${p.ftm}/${p.fta}` },
          { label: 'STL', value: p.stl },
          { label: 'BLK', value: p.blk },
          { label: 'TO', value: p.to },
          { label: '+/-', value: p.plusMinus > 0 ? `+${p.plusMinus}` : p.plusMinus },
          { label: 'MIN', value: p.minutes },
        ];
        return (
          <div className="mt-3 flex items-center gap-4 flex-wrap">
            <span className="text-sm font-semibold" style={{ color }}>{selectedPlayer}</span>
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-xs text-gray-400">{s.label}</div>
                <div className="text-sm font-semibold tabular-nums text-gray-700">{s.value}</div>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
