'use client';

import { useState, useMemo } from 'react';
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

function PlayerRow({
  player,
  statKey,
  maxValue,
  barColor,
}: {
  player: PlayerImpactData;
  statKey: StatKey;
  maxValue: number;
  barColor: string;
}) {
  const value = player[statKey];
  const isPlusMinus = statKey === 'plusMinus';
  const pct = isPlusMinus
    ? (Math.abs(value) / maxValue) * 50
    : (value / maxValue) * 100;

  const color = isPlusMinus
    ? value >= 0
      ? '#22c55e'
      : '#ef4444'
    : barColor;

  const lastName = player.playerName.split(' ').pop();

  return (
    <div className="flex items-center gap-3 py-1.5">
      {/* Name */}
      <div className="w-32 text-right shrink-0">
        <span className="text-sm text-gray-700">
          {player.isStarter && (
            <span className="text-amber-500 text-xs mr-1">S</span>
          )}
          {lastName}
        </span>
      </div>

      {/* Bar */}
      <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden relative">
        {isPlusMinus ? (
          // +/- bar: center-anchored
          <div className="absolute inset-0 flex">
            <div className="w-1/2 flex justify-end">
              {value < 0 && (
                <div
                  className="h-full rounded-l transition-all duration-300"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: color,
                    opacity: 0.7,
                  }}
                />
              )}
            </div>
            <div className="w-px bg-gray-300" />
            <div className="w-1/2">
              {value > 0 && (
                <div
                  className="h-full rounded-r transition-all duration-300"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: color,
                    opacity: 0.7,
                  }}
                />
              )}
            </div>
          </div>
        ) : (
          <div
            className="h-full rounded transition-all duration-300"
            style={{
              width: `${Math.max(pct, 1)}%`,
              backgroundColor: color,
              opacity: 0.7,
            }}
          />
        )}
      </div>

      {/* Value */}
      <div className="w-10 text-right shrink-0">
        <span className="text-sm font-semibold tabular-nums text-gray-700">
          {isPlusMinus && value > 0 ? '+' : ''}
          {value}
        </span>
      </div>
    </div>
  );
}

function TeamSection({
  players,
  statKey,
  teamLabel,
  maxValue,
  chartColor,
}: {
  players: PlayerImpactData[];
  statKey: StatKey;
  teamLabel: string;
  maxValue: number;
  chartColor: string;
}) {
  return (
    <div>
      <h4
        className="text-sm font-bold mb-2 pb-2 border-b border-gray-100"
        style={{ color: chartColor }}
      >
        {teamLabel}
      </h4>
      {players.map((player) => (
        <PlayerRow
          key={player.playerId}
          player={player}
          statKey={statKey}
          maxValue={maxValue}
          barColor={chartColor}
        />
      ))}
    </div>
  );
}

export default function PlayerImpact({
  home,
  away,
  meta,
}: PlayerImpactProps) {
  const [activeStat, setActiveStat] = useState<StatKey>('pts');

  const awayColors = getTeamColors(meta.awayTeam.abbreviation);
  const homeColors = getTeamColors(meta.homeTeam.abbreviation);

  const maxValue = useMemo(() => {
    const all = [...home, ...away];
    if (activeStat === 'plusMinus') {
      return Math.max(1, ...all.map((d) => Math.abs(d[activeStat])));
    }
    return Math.max(1, ...all.map((d) => d[activeStat]));
  }, [home, away, activeStat]);

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Player Box Score</h3>
      {/* Stat tabs */}
      <div className="flex gap-1 mb-5">
        {STATS.map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveStat(s.key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeStat === s.key
                ? 'bg-gray-200 text-gray-900'
                : 'bg-gray-100 text-gray-400 hover:text-gray-600'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        <TeamSection
          players={away}
          statKey={activeStat}
          teamLabel={meta.awayTeam.abbreviation}
          maxValue={maxValue}
          chartColor={awayColors.chart}
        />
        <TeamSection
          players={home}
          statKey={activeStat}
          teamLabel={meta.homeTeam.abbreviation}
          maxValue={maxValue}
          chartColor={homeColors.chart}
        />
      </div>
    </div>
  );
}
