'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useScoreboard } from '@/lib/api';
import { getTeamColors } from '@/lib/teamColors';

function formatDateForApi(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${mm}/${dd}/${date.getFullYear()}`;
}

function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDateDisplay(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function shiftDate(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export default function Home() {
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d;
  });

  const apiDate = formatDateForApi(date);
  const { data: games, isLoading, isError } = useScoreboard(apiDate);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2 text-gray-900">
        NBA Match Dashboard
      </h1>
      <p className="text-gray-500 mb-6">
        Interactive game visualizations — shot charts, assist networks, score
        timelines
      </p>

      {/* Date picker */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => setDate((d) => shiftDate(d, -1))}
          className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
        >
          &larr; Prev
        </button>
        <input
          type="date"
          value={formatDateForInput(date)}
          onChange={(e) => setDate(new Date(e.target.value + 'T12:00:00'))}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700"
        />
        <button
          onClick={() => setDate((d) => shiftDate(d, 1))}
          className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
        >
          Next &rarr;
        </button>
      </div>

      <h2 className="text-sm font-medium text-gray-400 mb-4">
        {formatDateDisplay(date)}
      </h2>

      {/* Games grid */}
      {isLoading && (
        <p className="text-gray-400 text-sm py-8 text-center">
          Loading games...
        </p>
      )}

      {isError && (
        <p className="text-red-400 text-sm py-8 text-center">
          Failed to load scoreboard. NBA API may be unavailable.
        </p>
      )}

      {games && games.length === 0 && (
        <p className="text-gray-400 text-sm py-8 text-center">
          No games scheduled for this date.
        </p>
      )}

      {games && games.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {games.map((game) => {
            const awayColors = getTeamColors(game.awayTeam.abbreviation);
            const homeColors = getTeamColors(game.homeTeam.abbreviation);

            return (
              <Link
                key={game.gameId}
                href={`/game/${game.gameId}`}
                className="block bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className="text-xs text-gray-400 mb-3 font-medium">
                  {game.status}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="text-lg font-bold"
                      style={{ color: awayColors.chart }}
                    >
                      {game.awayTeam.abbreviation}
                    </span>
                    <span className="text-2xl font-black tabular-nums text-gray-900">
                      {game.awayTeam.score}
                    </span>
                  </div>
                  <span className="text-gray-300 text-sm">vs</span>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-black tabular-nums text-gray-900">
                      {game.homeTeam.score}
                    </span>
                    <span
                      className="text-lg font-bold"
                      style={{ color: homeColors.chart }}
                    >
                      {game.homeTeam.abbreviation}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
