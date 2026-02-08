'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useGameData } from '@/lib/api';
import { useDashboardStore } from '@/store/dashboardStore';
import GameHeader from '@/components/match/GameHeader';
import TabNav from '@/components/match/TabNav';
import ShotChart from '@/components/court/ShotChart';
import AssistNetwork from '@/components/viz/AssistNetwork';
import PlayerImpact from '@/components/viz/PlayerImpact';
import WinProbability from '@/components/viz/WinProbability';
import { transformAssistNetwork } from '@/lib/transformers/assistNetwork';
import { transformScoreProgression } from '@/lib/transformers/winProbability';
import { transformPlayerImpact } from '@/lib/transformers/playerImpact';

export default function GamePage() {
  const params = useParams<{ gameId: string }>();
  const gameId = params.gameId;
  const { activeTab } = useDashboardStore();

  const { meta, shots, playByPlay, boxScore, isLoading, isError } =
    useGameData(gameId);

  const assistData = useMemo(() => {
    if (!playByPlay.data || !meta.data) return null;
    return transformAssistNetwork(
      playByPlay.data.game.actions,
      meta.data.homeTeam.teamId,
      meta.data.awayTeam.teamId
    );
  }, [playByPlay.data, meta.data]);

  const scoreMoments = useMemo(() => {
    if (!playByPlay.data) return null;
    return transformScoreProgression(playByPlay.data.game.actions);
  }, [playByPlay.data]);

  const impactData = useMemo(() => {
    if (!boxScore.data || !meta.data) return null;
    return transformPlayerImpact(
      boxScore.data,
      meta.data.homeTeam.teamId,
      meta.data.awayTeam.teamId
    );
  }, [boxScore.data, meta.data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white/50 text-lg">Loading game data...</div>
      </div>
    );
  }

  if (isError || !meta.data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-400 text-lg">Failed to load game data</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <GameHeader meta={meta.data} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 columns — Tab nav + active viz */}
        <div className="lg:col-span-2 space-y-4">
          <TabNav />

          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            {activeTab === 'shots' && shots.data && (
              <ShotChart shots={shots.data} meta={meta.data} />
            )}

            {activeTab === 'assists' && assistData && (
              <AssistNetwork
                home={assistData.home}
                away={assistData.away}
                homeTeamAbbrev={meta.data.homeTeam.abbreviation}
                awayTeamAbbrev={meta.data.awayTeam.abbreviation}
              />
            )}

            {activeTab === 'impact' && impactData && (
              <PlayerImpact
                home={impactData.home}
                away={impactData.away}
                meta={meta.data}
              />
            )}
          </div>
        </div>

        {/* Right column — Win probability + quick stats */}
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            {scoreMoments && (
              <WinProbability data={scoreMoments} meta={meta.data} />
            )}
          </div>

          {/* Quick stats */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-white/80 mb-3">
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
              return (
                <div
                  className="grid gap-2 text-xs text-center"
                  style={{
                    gridTemplateColumns: `60px repeat(${maxPeriods}, 1fr)`,
                  }}
                >
                  <div className="text-white/40">Team</div>
                  {headers.map((h) => (
                    <div key={h} className="text-white/40">{h}</div>
                  ))}
                  <div className="font-medium text-white/70">
                    {meta.data.awayTeam.abbreviation}
                  </div>
                  {meta.data.awayTeam.quarterScores.map((s, i) => (
                    <div key={i} className="text-white/60 tabular-nums">{s}</div>
                  ))}
                  <div className="font-medium text-white/70">
                    {meta.data.homeTeam.abbreviation}
                  </div>
                  {meta.data.homeTeam.quarterScores.map((s, i) => (
                    <div key={i} className="text-white/60 tabular-nums">{s}</div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Shot breakdown */}
          {shots.data && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-white/80 mb-3">
                Shooting Summary
              </h3>
              {[meta.data.awayTeam, meta.data.homeTeam].map((team) => {
                const teamShots = shots.data!.filter(
                  (s) => s.teamId === team.teamId
                );
                const made = teamShots.filter((s) => s.made).length;
                const threes = teamShots.filter(
                  (s) => s.shotType === '3PT Field Goal'
                );
                const threesMade = threes.filter((s) => s.made).length;
                return (
                  <div key={team.teamId} className="mb-2 last:mb-0">
                    <div className="text-xs font-medium text-white/60 mb-1">
                      {team.abbreviation}
                    </div>
                    <div className="text-xs text-white/40 space-x-3">
                      <span>
                        FG: {made}/{teamShots.length} (
                        {teamShots.length > 0
                          ? ((made / teamShots.length) * 100).toFixed(1)
                          : 0}
                        %)
                      </span>
                      <span>
                        3PT: {threesMade}/{threes.length} (
                        {threes.length > 0
                          ? ((threesMade / threes.length) * 100).toFixed(1)
                          : 0}
                        %)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
