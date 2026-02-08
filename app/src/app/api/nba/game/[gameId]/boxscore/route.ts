import { NextResponse } from 'next/server';
import { nbaFetch } from '@/lib/nba-fetch';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;

  try {
    const data = await nbaFetch('boxscoretraditionalv2', {
      GameID: gameId,
      StartPeriod: '0',
      EndPeriod: '14',
      RangeType: '0',
      StartRange: '0',
      EndRange: '28800',
    });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch boxscore' },
      { status: 502 }
    );
  }
}
