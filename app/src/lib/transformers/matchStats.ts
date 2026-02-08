import type { NbaResponse } from '@/types/nba';

export interface StatRow {
  label: string;
  away: number;
  home: number;
  format?: 'pct' | 'number';
}

export interface StatGroup {
  title: string;
  rows: StatRow[];
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

const SUM_FIELDS = [
  'FGM', 'FGA', 'FG3M', 'FG3A', 'FTM', 'FTA',
  'OREB', 'DREB', 'REB', 'AST', 'STL', 'BLK', 'TO', 'PF', 'PTS',
];

/** Aggregate PlayerStats into team totals when TeamStats is missing (CDN games) */
function aggregateTeamStats(players: Record<string, unknown>[]): Record<string, unknown>[] {
  const byTeam = new Map<number, Record<string, number>>();
  for (const p of players) {
    const tid = p.TEAM_ID as number;
    if (!byTeam.has(tid)) {
      const team: Record<string, number> = { TEAM_ID: tid };
      for (const f of SUM_FIELDS) team[f] = 0;
      byTeam.set(tid, team);
    }
    const team = byTeam.get(tid)!;
    for (const f of SUM_FIELDS) team[f] += (p[f] as number) || 0;
  }
  for (const team of byTeam.values()) {
    team.FG_PCT = team.FGA > 0 ? team.FGM / team.FGA : 0;
    team.FG3_PCT = team.FG3A > 0 ? team.FG3M / team.FG3A : 0;
    team.FT_PCT = team.FTA > 0 ? team.FTM / team.FTA : 0;
  }
  return [...byTeam.values()];
}

export function transformMatchStats(
  boxscoreRaw: NbaResponse,
  metaRaw: NbaResponse,
  homeTeamId: number,
  awayTeamId: number
): StatGroup[] {
  let teamStats = parseResultSet(boxscoreRaw, 'TeamStats');
  if (teamStats.length === 0) {
    teamStats = aggregateTeamStats(parseResultSet(boxscoreRaw, 'PlayerStats'));
  }
  const otherStats = parseResultSet(metaRaw, 'OtherStats');

  const home = teamStats.find((t) => t.TEAM_ID === homeTeamId) as Record<string, number>;
  const away = teamStats.find((t) => t.TEAM_ID === awayTeamId) as Record<string, number>;
  const homeOther = otherStats.find((t) => t.TEAM_ID === homeTeamId) as Record<string, number>;
  const awayOther = otherStats.find((t) => t.TEAM_ID === awayTeamId) as Record<string, number>;

  if (!home || !away) return [];

  return [
    {
      title: 'Shooting',
      rows: [
        { label: 'Field Goals', away: away.FGM, home: home.FGM },
        { label: 'FG%', away: away.FG_PCT * 100, home: home.FG_PCT * 100, format: 'pct' },
        { label: '3-Pointers', away: away.FG3M, home: home.FG3M },
        { label: '3PT%', away: away.FG3_PCT * 100, home: home.FG3_PCT * 100, format: 'pct' },
        { label: 'Free Throws', away: away.FTM, home: home.FTM },
        { label: 'FT%', away: away.FT_PCT * 100, home: home.FT_PCT * 100, format: 'pct' },
      ],
    },
    {
      title: 'Rebounding',
      rows: [
        { label: 'Offensive Reb', away: away.OREB, home: home.OREB },
        { label: 'Defensive Reb', away: away.DREB, home: home.DREB },
        { label: 'Total Rebounds', away: away.REB, home: home.REB },
      ],
    },
    {
      title: 'Playmaking',
      rows: [
        { label: 'Assists', away: away.AST, home: home.AST },
        { label: 'Steals', away: away.STL, home: home.STL },
        { label: 'Blocks', away: away.BLK, home: home.BLK },
        { label: 'Turnovers', away: away.TO, home: home.TO },
        { label: 'Fouls', away: away.PF, home: home.PF },
      ],
    },
    ...(homeOther && awayOther
      ? [
          {
            title: 'Scoring',
            rows: [
              { label: 'Points in Paint', away: awayOther.PTS_PAINT, home: homeOther.PTS_PAINT },
              { label: 'Fast Break Pts', away: awayOther.PTS_FB, home: homeOther.PTS_FB },
              { label: '2nd Chance Pts', away: awayOther.PTS_2ND_CHANCE, home: homeOther.PTS_2ND_CHANCE },
              { label: 'Pts off Turnovers', away: awayOther.PTS_OFF_TO, home: homeOther.PTS_OFF_TO },
              { label: 'Largest Lead', away: awayOther.LARGEST_LEAD, home: homeOther.LARGEST_LEAD },
            ],
          },
        ]
      : []),
  ];
}
