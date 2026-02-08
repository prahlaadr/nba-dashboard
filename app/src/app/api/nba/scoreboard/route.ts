import { NextRequest, NextResponse } from 'next/server';
import { nbaFetch } from '@/lib/nba-fetch';

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
    return NextResponse.json(
      { error: 'Failed to fetch scoreboard' },
      { status: 502 }
    );
  }
}
