'use client';

import { useState, useMemo } from 'react';
import * as d3 from 'd3';
import type { PlayerImpactData, GameMeta } from '@/types/nba';
import { getTeamColors } from '@/lib/teamColors';

interface PlayerImpactProps {
  home: PlayerImpactData[];
  away: PlayerImpactData[];
  meta: GameMeta;
}

type StatKey = 'pts' | 'reb' | 'ast' | 'plusMinus';

const STATS: { key: StatKey; label: string }[] = [
  { key: 'pts', label: 'PTS' },
  { key: 'reb', label: 'REB' },
  { key: 'ast', label: 'AST' },
  { key: 'plusMinus', label: '+/-' },
];

const BAR_HEIGHT = 22;
const LABEL_WIDTH = 100;
const CHART_WIDTH = 300;
const GAP = 3;

function TeamBars({
  players,
  statKey,
  teamLabel,
  teamId,
  maxValue,
}: {
  players: PlayerImpactData[];
  statKey: StatKey;
  teamLabel: string;
  teamId: number;
  maxValue: number;
}) {
  const colors = getTeamColors(teamLabel);

  const scale = d3
    .scaleLinear()
    .domain(statKey === 'plusMinus' ? [-maxValue, maxValue] : [0, maxValue])
    .range(statKey === 'plusMinus' ? [0, CHART_WIDTH] : [0, CHART_WIDTH]);

  const zeroX = statKey === 'plusMinus' ? scale(0) : 0;

  return (
    <div className="flex-1 min-w-0">
      <h4 className="text-xs font-semibold mb-2" style={{ color: colors.primary }}>
        {teamLabel}
      </h4>
      <svg
        viewBox={`0 0 ${LABEL_WIDTH + CHART_WIDTH + 40} ${players.length * (BAR_HEIGHT + GAP) + 5}`}
        className="w-full h-auto"
      >
        {players.map((player, i) => {
          const value = player[statKey];
          const y = i * (BAR_HEIGHT + GAP);

          let barX: number, barWidth: number;
          if (statKey === 'plusMinus') {
            barX = value >= 0 ? zeroX : scale(value);
            barWidth = Math.abs(scale(value) - zeroX);
          } else {
            barX = 0;
            barWidth = scale(value);
          }

          const barColor =
            statKey === 'plusMinus'
              ? value >= 0
                ? '#22c55e'
                : '#ef4444'
              : colors.primary;

          return (
            <g key={player.playerId} transform={`translate(0, ${y})`}>
              {/* Player name */}
              <text
                x={LABEL_WIDTH - 8}
                y={BAR_HEIGHT / 2}
                textAnchor="end"
                fill="#e2e8f0"
                fontSize={10}
                dy={3}
              >
                {player.isStarter && (
                  <tspan fill="#fbbf24" fontSize={8}>
                    {'★ '}
                  </tspan>
                )}
                {player.playerName.split(' ').pop()}
              </text>

              {/* Bar */}
              <rect
                x={LABEL_WIDTH + barX}
                y={2}
                width={Math.max(0, barWidth)}
                height={BAR_HEIGHT - 4}
                fill={barColor}
                opacity={0.75}
                rx={2}
              />

              {/* +/- zero line */}
              {statKey === 'plusMinus' && (
                <line
                  x1={LABEL_WIDTH + zeroX}
                  y1={0}
                  x2={LABEL_WIDTH + zeroX}
                  y2={BAR_HEIGHT}
                  stroke="white"
                  strokeOpacity={0.2}
                  strokeWidth={1}
                />
              )}

              {/* Value label */}
              <text
                x={LABEL_WIDTH + barX + barWidth + 4}
                y={BAR_HEIGHT / 2}
                fill="#94a3b8"
                fontSize={9}
                dy={3}
              >
                {statKey === 'plusMinus' && value > 0 ? '+' : ''}
                {value}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function PlayerImpact({
  home,
  away,
  meta,
}: PlayerImpactProps) {
  const [activeStat, setActiveStat] = useState<StatKey>('pts');

  const maxValue = useMemo(() => {
    const all = [...home, ...away];
    if (activeStat === 'plusMinus') {
      return Math.max(1, d3.max(all, (d) => Math.abs(d[activeStat])) ?? 1);
    }
    return Math.max(1, d3.max(all, (d) => d[activeStat]) ?? 1);
  }, [home, away, activeStat]);

  return (
    <div>
      {/* Stat tabs */}
      <div className="flex gap-1 mb-4">
        {STATS.map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveStat(s.key)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeStat === s.key
                ? 'bg-white/20 text-white'
                : 'bg-white/5 text-white/50 hover:text-white/80'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex gap-6">
        <TeamBars
          players={away}
          statKey={activeStat}
          teamLabel={meta.awayTeam.abbreviation}
          teamId={meta.awayTeam.teamId}
          maxValue={maxValue}
        />
        <TeamBars
          players={home}
          statKey={activeStat}
          teamLabel={meta.homeTeam.abbreviation}
          teamId={meta.homeTeam.teamId}
          maxValue={maxValue}
        />
      </div>
    </div>
  );
}
