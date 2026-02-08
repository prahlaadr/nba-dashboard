const NBA_BASE = 'https://stats.nba.com/stats';

const NBA_HEADERS: Record<string, string> = {
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  Origin: 'https://www.nba.com',
  Referer: 'https://www.nba.com/',
  'x-nba-stats-origin': 'stats',
  'x-nba-stats-token': 'true',
};

export async function nbaFetch(
  endpoint: string,
  params: Record<string, string>
): Promise<unknown> {
  const url = new URL(`${NBA_BASE}/${endpoint}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    headers: NBA_HEADERS,
    next: { revalidate: 300 }, // cache 5 min
  });

  if (!res.ok) {
    throw new Error(`NBA API ${endpoint} returned ${res.status}`);
  }

  return res.json();
}

/** "002" prefix → Regular Season, "004" → Playoffs */
export function getSeasonType(gameId: string): string {
  const prefix = gameId.substring(0, 3);
  if (prefix === '004') return 'Playoffs';
  return 'Regular Season';
}

/** Digits 3-4 of gameId → "20XX-YY" season string */
export function getSeasonYear(gameId: string): string {
  const yy = parseInt(gameId.substring(3, 5), 10);
  const startYear = 2000 + yy;
  const endYY = String(startYear + 1).slice(-2);
  return `${startYear}-${endYY}`;
}
