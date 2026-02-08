// Raw NBA API response types

export interface NbaResultSet {
  name: string;
  headers: string[];
  rowSet: (string | number | null)[][];
}

export interface NbaResponse {
  resource: string;
  parameters: Record<string, unknown>;
  resultSets: NbaResultSet[];
}

// V3 Play-by-Play
export interface PbpAction {
  actionNumber: number;
  clock: string; // "PT11M25.00S"
  period: number;
  teamId: number;
  teamTricode: string;
  personId: number;
  playerName: string;
  playerNameI: string;
  xLegacy: number;
  yLegacy: number;
  shotDistance: number;
  shotResult: string;
  isFieldGoal: number;
  scoreHome: string;
  scoreAway: string;
  pointsTotal: number;
  location: string;
  description: string;
  actionType: string;
  subType: string;
  videoAvailable: number;
  shotValue: number;
  actionId: number;
  qualifiers?: string[];
  assistPersonId?: number;
  assistPlayerNameInitial?: string;
}

export interface PbpResponse {
  meta: { version: number };
  game: {
    gameId: string;
    videoAvailable: number;
    actions: PbpAction[];
  };
}

// V3 Advanced Box Score
export interface AdvancedPlayerStats {
  status: string;
  order: number;
  personId: number;
  jerseyNum: string;
  position: string;
  starter: string;
  oncourt: string;
  played: string;
  statistics: {
    minutes: string;
    estimatedOffensiveRating: number;
    offensiveRating: number;
    estimatedDefensiveRating: number;
    defensiveRating: number;
    estimatedNetRating: number;
    netRating: number;
    assistPercentage: number;
    assistToTurnover: number;
    assistRatio: number;
    offensiveReboundPercentage: number;
    defensiveReboundPercentage: number;
    reboundPercentage: number;
    turnoverRatio: number;
    effectiveFieldGoalPercentage: number;
    trueShootingPercentage: number;
    usagePercentage: number;
    estimatedUsagePercentage: number;
    estimatedPace: number;
    pace: number;
    pacePer40: number;
    possessions: number;
    PIE: number;
  };
  name: string;
  nameI: string;
  firstName: string;
  familyName: string;
}

export interface AdvancedTeam {
  teamId: number;
  teamCity: string;
  teamName: string;
  teamTricode: string;
  teamSlug: string;
  players: AdvancedPlayerStats[];
  statistics: Record<string, number>;
}

export interface AdvancedBoxScoreResponse {
  meta: { version: number };
  boxScoreAdvanced: {
    gameId: string;
    awayTeamId: number;
    homeTeamId: number;
    homeTeam: AdvancedTeam;
    awayTeam: AdvancedTeam;
  };
}

// Scoreboard
export interface ScoreboardGame {
  gameId: string;
  status: string;
  homeTeam: { abbreviation: string; score: number };
  awayTeam: { abbreviation: string; score: number };
}

// Transformed types for components

export interface ShotEvent {
  gameEventId: number;
  playerId: number;
  playerName: string;
  teamId: number;
  teamName: string;
  period: number;
  minutesRemaining: number;
  secondsRemaining: number;
  eventType: string; // "Made Shot" | "Missed Shot"
  actionType: string;
  shotType: string; // "2PT Field Goal" | "3PT Field Goal"
  shotZoneBasic: string;
  shotDistance: number;
  locX: number;
  locY: number;
  made: boolean;
}

export interface PlayerBoxScore {
  gameId: string;
  teamId: number;
  teamAbbreviation: string;
  playerId: number;
  playerName: string;
  startPosition: string;
  minutes: string;
  fgm: number;
  fga: number;
  fgPct: number;
  fg3m: number;
  fg3a: number;
  fg3Pct: number;
  ftm: number;
  fta: number;
  ftPct: number;
  oreb: number;
  dreb: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  to: number;
  pf: number;
  pts: number;
  plusMinus: number;
}

export interface TeamInfo {
  teamId: number;
  abbreviation: string;
  city: string;
  nickname: string;
  score: number;
  record: string;
  quarterScores: number[];
}

export interface GameMeta {
  gameId: string;
  date: string;
  status: string;
  arena: string;
  attendance: number;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  seriesLeader: string;
}

// Transformed viz types

export interface ScoreMoment {
  gameSeconds: number; // 0–2880
  period: number;
  clock: string;
  scoreHome: number;
  scoreAway: number;
  differential: number; // home - away
  description: string;
}

export interface AssistLink {
  source: string; // player name
  target: string; // player name
  value: number; // count
}

export interface AssistNode {
  id: string; // player name
  assists: number;
  teamId: number;
}

export interface AssistGraph {
  nodes: AssistNode[];
  links: AssistLink[];
}

export interface PlayerImpactData {
  playerId: number;
  playerName: string;
  teamId: number;
  teamAbbreviation: string;
  isStarter: boolean;
  minutes: number;
  pts: number;
  reb: number;
  ast: number;
  plusMinus: number;
}
