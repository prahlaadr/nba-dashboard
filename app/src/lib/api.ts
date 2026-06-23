'use client';

import { useQuery } from '@tanstack/react-query';
import type {
  NbaResponse,
  PbpResponse,
  ShotEvent,
  PlayerBoxScore,
  GameMeta,
  ScoreboardGame,
} from '@/types/nba';

async function fetchFromApi<T>(
  gameId: string,
  endpoint: string
): Promise<T> {
  const res = await fetch(`/api/nba/game/${gameId}/${endpoint}`);
  if (!res.ok) throw new Error(`API ${endpoint} returned ${res.status}`);
  return res.json();
}

async function fetchScoreboardApi(date: string): Promise<NbaResponse> {
  const res = await fetch(`/api/nba/scoreboard?date=${encodeURIComponent(date)}`);
  if (!res.ok) throw new Error(`Scoreboard API returned ${res.status}`);
  return res.json();
}

function parseResultSet(response: NbaResponse, name: string) {
  const rs = response.resultSets.find((r) => r.name === name);
  if (!rs) return [];
  return rs.rowSet.map((row) => {
    const obj: Record<string, unknown> = {};
    rs.headers.forEach((h, i) => {
      obj[h] = row[i];
    });
    return obj;
  });
}

export function parseMeta(response: NbaResponse): GameMeta {
  const summary = parseResultSet(response, 'GameSummary')[0] as Record<string, unknown>;
  const lineScores = parseResultSet(response, 'LineScore') as Record<string, unknown>[];
  const gameInfo = parseResultSet(response, 'GameInfo')[0] as Record<string, unknown>;

  const homeLineScore = lineScores.find(
    (ls) => ls.TEAM_ID === summary.HOME_TEAM_ID
  ) as Record<string, unknown>;
  const awayLineScore = lineScores.find(
    (ls) => ls.TEAM_ID === summary.VISITOR_TEAM_ID
  ) as Record<string, unknown>;

  const makeTeam = (ls: Record<string, unknown>) => {
    const qScores = [
      ls.PTS_QTR1 as number,
      ls.PTS_QTR2 as number,
      ls.PTS_QTR3 as number,
      ls.PTS_QTR4 as number,
    ];
    // Add OT periods if they exist
    for (let i = 1; i <= 10; i++) {
      const otPts = ls[`PTS_OT${i}`] as number;
      if (otPts && otPts > 0) qScores.push(otPts);
    }
    return {
      teamId: ls.TEAM_ID as number,
      abbreviation: ls.TEAM_ABBREVIATION as string,
      city: ls.TEAM_CITY_NAME as string,
      nickname: ls.TEAM_NICKNAME as string,
      score: ls.PTS as number,
      record: ls.TEAM_WINS_LOSSES as string,
      quarterScores: qScores,
    };
  };

  return {
    gameId: summary.GAME_ID as string,
    date: (gameInfo?.GAME_DATE as string) ?? '',
    status: summary.GAME_STATUS_TEXT as string,
    arena: '',
    attendance: (gameInfo?.ATTENDANCE as number) ?? 0,
    homeTeam: makeTeam(homeLineScore),
    awayTeam: makeTeam(awayLineScore),
    seriesLeader: '',
  };
}

export function parseShots(response: NbaResponse): ShotEvent[] {
  const rows = parseResultSet(response, 'Shot_Chart_Detail');
  return rows.map((r: Record<string, unknown>) => ({
    gameEventId: r.GAME_EVENT_ID as number,
    playerId: r.PLAYER_ID as number,
    playerName: r.PLAYER_NAME as string,
    teamId: r.TEAM_ID as number,
    teamName: r.TEAM_NAME as string,
    period: r.PERIOD as number,
    minutesRemaining: r.MINUTES_REMAINING as number,
    secondsRemaining: r.SECONDS_REMAINING as number,
    eventType: r.EVENT_TYPE as string,
    actionType: r.ACTION_TYPE as string,
    shotType: r.SHOT_TYPE as string,
    shotZoneBasic: r.SHOT_ZONE_BASIC as string,
    shotDistance: r.SHOT_DISTANCE as number,
    locX: r.LOC_X as number,
    locY: r.LOC_Y as number,
    made: (r.SHOT_MADE_FLAG as number) === 1,
  }));
}

export function parseBoxScore(response: NbaResponse): PlayerBoxScore[] {
  const rows = parseResultSet(response, 'PlayerStats');
  return rows.map((r: Record<string, unknown>) => ({
    gameId: r.GAME_ID as string,
    teamId: r.TEAM_ID as number,
    teamAbbreviation: r.TEAM_ABBREVIATION as string,
    playerId: r.PLAYER_ID as number,
    playerName: r.PLAYER_NAME as string,
    startPosition: r.START_POSITION as string,
    minutes: r.MIN as string,
    fgm: r.FGM as number,
    fga: r.FGA as number,
    fgPct: r.FG_PCT as number,
    fg3m: r.FG3M as number,
    fg3a: r.FG3A as number,
    fg3Pct: r.FG3_PCT as number,
    ftm: r.FTM as number,
    fta: r.FTA as number,
    ftPct: r.FT_PCT as number,
    oreb: r.OREB as number,
    dreb: r.DREB as number,
    reb: r.REB as number,
    ast: r.AST as number,
    stl: r.STL as number,
    blk: r.BLK as number,
    to: r.TO as number,
    pf: r.PF as number,
    pts: r.PTS as number,
    plusMinus: r.PLUS_MINUS as number,
  }));
}

export function parseScoreboard(response: NbaResponse): ScoreboardGame[] {
  const headers = parseResultSet(response, 'GameHeader') as Record<string, unknown>[];
  const lineScores = parseResultSet(response, 'LineScore') as Record<string, unknown>[];

  return headers.map((g) => {
    const gameId = g.GAME_ID as string;
    const homeLine = lineScores.find(
      (ls) => ls.GAME_ID === gameId && ls.TEAM_ID === g.HOME_TEAM_ID
    );
    const awayLine = lineScores.find(
      (ls) => ls.GAME_ID === gameId && ls.TEAM_ID === g.VISITOR_TEAM_ID
    );
    return {
      gameId,
      status: g.GAME_STATUS_TEXT as string,
      homeTeam: {
        abbreviation: (homeLine?.TEAM_ABBREVIATION as string) ?? '',
        score: (homeLine?.PTS as number) ?? 0,
      },
      awayTeam: {
        abbreviation: (awayLine?.TEAM_ABBREVIATION as string) ?? '',
        score: (awayLine?.PTS as number) ?? 0,
      },
    };
  });
}

const QUERY_OPTS = {
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

export function useScoreboard(date: string) {
  return useQuery({
    queryKey: ['scoreboard', date],
    queryFn: async () => {
      const raw = await fetchScoreboardApi(date);
      return parseScoreboard(raw);
    },
    enabled: !!date,
    ...QUERY_OPTS,
  });
}

export function useGameData(gameId: string) {
  const metaRaw = useQuery({
    queryKey: ['meta_raw', gameId],
    queryFn: () => fetchFromApi<NbaResponse>(gameId, 'meta'),
    ...QUERY_OPTS,
  });

  const meta = useQuery({
    queryKey: ['meta', gameId],
    queryFn: () => parseMeta(metaRaw.data!),
    enabled: !!metaRaw.data,
    ...QUERY_OPTS,
  });

  const shots = useQuery({
    queryKey: ['shots', gameId],
    queryFn: async () => {
      const raw = await fetchFromApi<NbaResponse>(gameId, 'shots');
      return parseShots(raw);
    },
    ...QUERY_OPTS,
  });

  const playByPlay = useQuery({
    queryKey: ['playbyplay', gameId],
    queryFn: () => fetchFromApi<PbpResponse>(gameId, 'playbyplay'),
    ...QUERY_OPTS,
  });

  const boxscoreRaw = useQuery({
    queryKey: ['boxscore_raw', gameId],
    queryFn: () => fetchFromApi<NbaResponse>(gameId, 'boxscore'),
    ...QUERY_OPTS,
  });

  const boxScore = useQuery({
    queryKey: ['boxscore', gameId],
    queryFn: () => parseBoxScore(boxscoreRaw.data!),
    enabled: !!boxscoreRaw.data,
    ...QUERY_OPTS,
  });

  return {
    meta,
    metaRaw,
    shots,
    playByPlay,
    boxScore,
    boxscoreRaw,
    isLoading:
      meta.isLoading ||
      shots.isLoading ||
      playByPlay.isLoading ||
      boxScore.isLoading,
    isError:
      meta.isError || shots.isError || playByPlay.isError || boxScore.isError,
  };
}
