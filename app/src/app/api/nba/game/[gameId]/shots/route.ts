import { NextResponse } from 'next/server';
import { nbaFetch, getSeasonType, getSeasonYear } from '@/lib/nba-fetch';
import { readLocalGameData } from '@/lib/local-data';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;
  const season = getSeasonYear(gameId);
  const seasonType = getSeasonType(gameId);

  try {
    const data = await nbaFetch('shotchartdetail', {
      GameID: gameId,
      PlayerID: '0',
      TeamID: '0',
      Season: season,
      SeasonType: seasonType,
      ContextMeasure: 'FGA',
      LeagueID: '00',
      PlayerPosition: '',
      DateFrom: '',
      DateTo: '',
      GameSegment: '',
      LastNGames: '0',
      Location: '',
      Month: '0',
      OpponentTeamID: '0',
      Outcome: '',
      Period: '0',
      RookieYear: '',
      SeasonSegment: '',
      VsConference: '',
      VsDivision: '',
      AheadBehind: '',
      ClutchTime: '',
      PointDiff: '',
      RangeType: '0',
      StartPeriod: '1',
      EndPeriod: '10',
      StartRange: '0',
      EndRange: '28800',
    });
    return NextResponse.json(data);
  } catch {
    const local = await readLocalGameData(gameId, 'shots');
    if (local) return NextResponse.json(local);
    return NextResponse.json(
      { error: 'Failed to fetch shots' },
      { status: 502 }
    );
  }
}
