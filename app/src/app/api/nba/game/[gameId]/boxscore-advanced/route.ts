import { NextResponse } from 'next/server';
import { nbaFetch } from '@/lib/nba-fetch';
import { readLocalGameData } from '@/lib/local-data';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;

  try {
    const data = await nbaFetch('boxscoreadvancedv3', {
      GameID: gameId,
      StartPeriod: '0',
      EndPeriod: '14',
      RangeType: '0',
      StartRange: '0',
      EndRange: '28800',
    });
    return NextResponse.json(data);
  } catch {
    const local = await readLocalGameData(gameId, 'boxscore-advanced');
    if (local) return NextResponse.json(local);
    return NextResponse.json(
      { error: 'Failed to fetch advanced boxscore' },
      { status: 502 }
    );
  }
}
