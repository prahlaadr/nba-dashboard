'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useGameData } from '@/lib/api';
import { useDashboardStore } from '@/store/dashboardStore';
import GameHeader from '@/components/match/GameHeader';
import TabNav from '@/components/match/TabNav';
import ShotChart from '@/components/court/ShotChart';
import PlayerImpact from '@/components/viz/PlayerImpact';
import MatchStats from '@/components/viz/MatchStats';
import WinProbability from '@/components/viz/WinProbability';
import { transformScoreProgression, detectScoringRuns } from '@/lib/transformers/winProbability';
import { transformPlayerImpact } from '@/lib/transformers/playerImpact';
import { transformMatchStats } from '@/lib/transformers/matchStats';
import { getTeamColors } from '@/lib/teamColors';

export default function GamePage() {
  const params = useParams<{ gameId: string }>();
  const gameId = params.gameId;
  const { activeTab } = useDashboardStore();

  const { meta, metaRaw, shots, playByPlay, boxScore, boxscoreRaw, isLoading, isError } =
    useGameData(gameId);

  const scoreMoments = useMemo(() => {
    if (!playByPlay.data) return null;
    return transformScoreProgression(playByPlay.data.game.actions);
  }, [playByPlay.data]);

  const scoringRuns = useMemo(() => {
    if (!scoreMoments || !meta.data) return undefined;
    return detectScoringRuns(scoreMoments.moments, meta.data);
  }, [scoreMoments, meta.data]);

  const impactData = useMemo(() => {
    if (!boxScore.data || !meta.data) return null;
    return transformPlayerImpact(
      boxScore.data,
      meta.data.homeTeam.teamId,
      meta.data.awayTeam.teamId
    );
  }, [boxScore.data, meta.data]);

  const matchStatsData = useMemo(() => {
    if (!boxscoreRaw.data || !metaRaw.data || !meta.data) return null;
    return transformMatchStats(
      boxscoreRaw.data,
      metaRaw.data,
      meta.data.homeTeam.teamId,
      meta.data.awayTeam.teamId
    );
  }, [boxscoreRaw.data, metaRaw.data, meta.data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400 text-lg">Loading game data...</div>
      </div>
    );
  }

  if (isError || !meta.data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 text-lg">Failed to load game data</div>
      </div>
    );
  }

  const awayChartColor = getTeamColors(meta.data.awayTeam.abbreviation).chart;
  const homeChartColor = getTeamColors(meta.data.homeTeam.abbreviation).chart;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <Link
        href="/"
        className="inline-block text-sm text-gray-400 hover:text-gray-600 transition-colors mb-2"
      >
        ← All Games
      </Link>
      <GameHeader meta={meta.data} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 columns — Tab nav + active viz */}
        <div className="lg:col-span-2 space-y-4">
          <TabNav />

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            {activeTab === 'shots' && shots.data && (
              <ShotChart shots={shots.data} meta={meta.data} boxScore={boxScore.data ?? []} />
            )}

            {activeTab === 'impact' && impactData && (
              <PlayerImpact
                home={impactData.home}
                away={impactData.away}
                meta={meta.data}
              />
            )}

            {activeTab === 'stats' && matchStatsData && (
              <MatchStats groups={matchStatsData} meta={meta.data} />
            )}
          </div>
        </div>

        {/* Right column — Win probability + quick stats */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            {scoreMoments && (
              <WinProbability data={scoreMoments} meta={meta.data} scoringRuns={scoringRuns} />
            )}
          </div>

          {/* Quarter scores */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Quarter Scores
            </h3>
            {(() => {
              const maxPeriods = Math.max(
                meta.data.homeTeam.quarterScores.length,
                meta.data.awayTeam.quarterScores.length
              );
              const headers = Array.from({ length: maxPeriods }, (_, i) =>
                i < 4 ? `Q${i + 1}` : `OT${i - 3}`
              );
              const awayScores = meta.data.awayTeam.quarterScores;
              const homeScores = meta.data.homeTeam.quarterScores;
              return (
                <div
                  className="grid gap-y-2 gap-x-1 text-sm text-center"
                  style={{
                    gridTemplateColumns: `60px repeat(${maxPeriods}, 1fr) 40px`,
                  }}
                >
                  {/* Header row */}
                  <div />
                  {headers.map((h) => (
                    <div key={h} className="text-xs text-gray-400 font-medium">{h}</div>
                  ))}
                  <div className="text-xs text-gray-400 font-medium">T</div>

                  {/* Away row */}
                  <div className="font-semibold text-left" style={{ color: awayChartColor }}>
                    {meta.data.awayTeam.abbreviation}
                  </div>
                  {awayScores.map((s, i) => {
                    const won = s > (homeScores[i] ?? 0);
                    return (
                      <div key={i} className={`tabular-nums ${won ? 'font-semibold text-gray-800' : 'text-gray-400'}`}>{s}</div>
                    );
                  })}
                  <div className="font-bold tabular-nums text-gray-800">
                    {meta.data.awayTeam.score}
                  </div>

                  {/* Home row */}
                  <div className="font-semibold text-left" style={{ color: homeChartColor }}>
                    {meta.data.homeTeam.abbreviation}
                  </div>
                  {homeScores.map((s, i) => {
                    const won = s > (awayScores[i] ?? 0);
                    return (
                      <div key={i} className={`tabular-nums ${won ? 'font-semibold text-gray-800' : 'text-gray-400'}`}>{s}</div>
                    );
                  })}
                  <div className="font-bold tabular-nums text-gray-800">
                    {meta.data.homeTeam.score}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Shooting summary */}
          {shots.data && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Shooting Summary
              </h3>
              <div className="space-y-3">
                {[
                  { team: meta.data.awayTeam, color: awayChartColor },
                  { team: meta.data.homeTeam, color: homeChartColor },
                ].map(({ team, color }) => {
                  const teamShots = shots.data!.filter(
                    (s) => s.teamId === team.teamId
                  );
                  const made = teamShots.filter((s) => s.made).length;
                  const fgPct = teamShots.length > 0 ? (made / teamShots.length) * 100 : 0;
                  const threes = teamShots.filter(
                    (s) => s.shotType === '3PT Field Goal'
                  );
                  const threesMade = threes.filter((s) => s.made).length;
                  const threePct = threes.length > 0 ? (threesMade / threes.length) * 100 : 0;
                  return (
                    <div key={team.teamId}>
                      <div className="text-xs font-semibold mb-2" style={{ color }}>
                        {team.abbreviation}
                      </div>
                      {/* FG bar */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs text-gray-500 w-8">FG</span>
                        <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
                          <div
                            className="h-full rounded"
                            style={{ width: `${fgPct}%`, backgroundColor: color, opacity: 0.6 }}
                          />
                        </div>
                        <span className="text-xs tabular-nums text-gray-600 w-24 text-right">
                          {made}/{teamShots.length} ({fgPct.toFixed(1)}%)
                        </span>
                      </div>
                      {/* 3PT bar */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-8">3PT</span>
                        <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
                          <div
                            className="h-full rounded"
                            style={{ width: `${threePct}%`, backgroundColor: color, opacity: 0.6 }}
                          />
                        </div>
                        <span className="text-xs tabular-nums text-gray-600 w-24 text-right">
                          {threesMade}/{threes.length} ({threePct.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
