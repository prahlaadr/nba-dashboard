import { NextRequest, NextResponse } from 'next/server';
import { nbaFetch } from '@/lib/nba-fetch';
import { listLocalGames, readLocalGameData } from '@/lib/local-data';

interface NbaResultSet {
  name: string;
  headers: string[];
  rowSet: (string | number | null)[][];
}

interface NbaResponse {
  resultSets: NbaResultSet[];
}

/** Build a minimal scoreboard response from local game data */
async function buildLocalScoreboard(): Promise<NbaResponse> {
  const gameIds = await listLocalGames();

  const gameHeaders: (string | number | null)[][] = [];
  const lineScores: (string | number | null)[][] = [];

  for (const gameId of gameIds) {
    const meta = (await readLocalGameData(gameId, 'meta')) as NbaResponse | null;
    if (!meta) continue;

    const summaryRs = meta.resultSets.find((r) => r.name === 'GameSummary');
    if (!summaryRs || summaryRs.rowSet.length === 0) continue;
    gameHeaders.push(summaryRs.rowSet[0]);

    const lineRs = meta.resultSets.find((r) => r.name === 'LineScore');
    if (lineRs) lineScores.push(...lineRs.rowSet);
  }

  const summaryRs = gameIds.length > 0
    ? ((await readLocalGameData(gameIds[0], 'meta')) as NbaResponse)?.resultSets.find(
        (r) => r.name === 'GameSummary'
      )
    : null;
  const lineRsTemplate = gameIds.length > 0
    ? ((await readLocalGameData(gameIds[0], 'meta')) as NbaResponse)?.resultSets.find(
        (r) => r.name === 'LineScore'
      )
    : null;

  return {
    resultSets: [
      {
        name: 'GameHeader',
        headers: summaryRs?.headers ?? [
          'GAME_DATE_EST', 'GAME_SEQUENCE', 'GAME_ID', 'GAME_STATUS_ID',
          'GAME_STATUS_TEXT', 'GAMECODE', 'HOME_TEAM_ID', 'VISITOR_TEAM_ID',
        ],
        rowSet: gameHeaders,
      },
      {
        name: 'LineScore',
        headers: lineRsTemplate?.headers ?? [
          'GAME_DATE_EST', 'GAME_SEQUENCE', 'GAME_ID', 'TEAM_ID',
          'TEAM_ABBREVIATION', 'TEAM_CITY_NAME', 'TEAM_NICKNAME', 'TEAM_WINS_LOSSES',
          'PTS_QTR1', 'PTS_QTR2', 'PTS_QTR3', 'PTS_QTR4',
          'PTS_OT1', 'PTS_OT2', 'PTS_OT3', 'PTS_OT4', 'PTS_OT5',
          'PTS_OT6', 'PTS_OT7', 'PTS_OT8', 'PTS_OT9', 'PTS_OT10',
          'PTS', 'FG_PCT', 'FT_PCT', 'FG3_PCT', 'AST', 'REB', 'TOV',
        ],
        rowSet: lineScores,
      },
    ],
  };
}

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get('date');
  if (!date) {
    return NextResponse.json({ error: 'date param required' }, { status: 400 });
  }

  try {
    const data = await nbaFetch('scoreboardv2', {
      GameDate: date,
      LeagueID: '00',
      DayOffset: '0',
    });
    return NextResponse.json(data);
  } catch {
    // NBA API unavailable — serve local sample games regardless of date
    const fallback = await buildLocalScoreboard();
    if (fallback.resultSets[0].rowSet.length > 0) {
      return NextResponse.json(fallback);
    }
    return NextResponse.json(
      { error: 'Failed to fetch scoreboard' },
      { status: 502 }
    );
  }
}
