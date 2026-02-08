import { NextResponse } from 'next/server';
import { nbaFetch } from '@/lib/nba-fetch';
import { readLocalGameData } from '@/lib/local-data';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;

  try {
    const data = await nbaFetch('boxscoresummaryv2', { GameID: gameId });
    return NextResponse.json(data);
  } catch {
    const local = await readLocalGameData(gameId, 'meta');
    if (local) return NextResponse.json(local);
    return NextResponse.json(
      { error: 'Failed to fetch game meta' },
      { status: 502 }
    );
  }
}
