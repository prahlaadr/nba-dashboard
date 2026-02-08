interface TeamColors {
  primary: string;
  secondary: string;
  chart: string; // bright color for data marks on dark backgrounds
}

const TEAM_COLORS: Record<string, TeamColors> = {
  ATL: { primary: '#E03A3E', secondary: '#C1D32F', chart: '#E03A3E' },
  BOS: { primary: '#007A33', secondary: '#BA9653', chart: '#2DD66B' },
  BKN: { primary: '#000000', secondary: '#FFFFFF', chart: '#AAAAAA' },
  CHA: { primary: '#1D1160', secondary: '#00788C', chart: '#00788C' },
  CHI: { primary: '#CE1141', secondary: '#000000', chart: '#CE1141' },
  CLE: { primary: '#860038', secondary: '#FDBB30', chart: '#FDBB30' },
  DAL: { primary: '#00538C', secondary: '#002B5E', chart: '#4DA3E0' },
  DEN: { primary: '#0E2240', secondary: '#FEC524', chart: '#FEC524' },
  DET: { primary: '#C8102E', secondary: '#006BB6', chart: '#C8102E' },
  GSW: { primary: '#1D428A', secondary: '#FFC72C', chart: '#FFC72C' },
  HOU: { primary: '#CE1141', secondary: '#000000', chart: '#CE1141' },
  IND: { primary: '#002D62', secondary: '#FDBB30', chart: '#FDBB30' },
  LAC: { primary: '#C8102E', secondary: '#1D428A', chart: '#C8102E' },
  LAL: { primary: '#552583', secondary: '#FDB927', chart: '#FDB927' },
  MEM: { primary: '#5D76A9', secondary: '#12173F', chart: '#7EB3E0' },
  MIA: { primary: '#98002E', secondary: '#F9A01B', chart: '#F9A01B' },
  MIL: { primary: '#00471B', secondary: '#EEE1C6', chart: '#2DD66B' },
  MIN: { primary: '#0C2340', secondary: '#236192', chart: '#78BE20' },
  NOP: { primary: '#0C2340', secondary: '#C8102E', chart: '#C8102E' },
  NYK: { primary: '#006BB6', secondary: '#F58426', chart: '#F58426' },
  OKC: { primary: '#007AC1', secondary: '#EF6100', chart: '#EF6100' },
  ORL: { primary: '#0077C0', secondary: '#000000', chart: '#4DC3FF' },
  PHI: { primary: '#006BB6', secondary: '#ED174C', chart: '#ED174C' },
  PHX: { primary: '#1D1160', secondary: '#E56020', chart: '#E56020' },
  POR: { primary: '#E03A3E', secondary: '#000000', chart: '#E03A3E' },
  SAC: { primary: '#5A2D81', secondary: '#63727A', chart: '#9B6DD7' },
  SAS: { primary: '#C4CED4', secondary: '#000000', chart: '#C4CED4' },
  TOR: { primary: '#CE1141', secondary: '#000000', chart: '#CE1141' },
  UTA: { primary: '#002B5C', secondary: '#00471B', chart: '#F8D64E' },
  WAS: { primary: '#002B5C', secondary: '#E31837', chart: '#E31837' },
};

export function getTeamColors(abbreviation: string): TeamColors {
  return TEAM_COLORS[abbreviation] ?? { primary: '#666666', secondary: '#999999' };
}

export function getTeamColorsByTeamId(teamId: number): TeamColors {
  const abbrevMap: Record<number, string> = {
    1610612737: 'ATL', 1610612738: 'BOS', 1610612751: 'BKN',
    1610612766: 'CHA', 1610612741: 'CHI', 1610612739: 'CLE',
    1610612742: 'DAL', 1610612743: 'DEN', 1610612765: 'DET',
    1610612744: 'GSW', 1610612745: 'HOU', 1610612754: 'IND',
    1610612746: 'LAC', 1610612747: 'LAL', 1610612763: 'MEM',
    1610612748: 'MIA', 1610612749: 'MIL', 1610612750: 'MIN',
    1610612740: 'NOP', 1610612752: 'NYK', 1610612760: 'OKC',
    1610612753: 'ORL', 1610612755: 'PHI', 1610612756: 'PHX',
    1610612757: 'POR', 1610612758: 'SAC', 1610612759: 'SAS',
    1610612761: 'TOR', 1610612762: 'UTA', 1610612764: 'WAS',
  };
  const abbrev = abbrevMap[teamId] ?? '';
  return getTeamColors(abbrev);
}

export function getTeamAbbreviation(teamId: number): string {
  const abbrevMap: Record<number, string> = {
    1610612737: 'ATL', 1610612738: 'BOS', 1610612751: 'BKN',
    1610612766: 'CHA', 1610612741: 'CHI', 1610612739: 'CLE',
    1610612742: 'DAL', 1610612743: 'DEN', 1610612765: 'DET',
    1610612744: 'GSW', 1610612745: 'HOU', 1610612754: 'IND',
    1610612746: 'LAC', 1610612747: 'LAL', 1610612763: 'MEM',
    1610612748: 'MIA', 1610612749: 'MIL', 1610612750: 'MIN',
    1610612740: 'NOP', 1610612752: 'NYK', 1610612760: 'OKC',
    1610612753: 'ORL', 1610612755: 'PHI', 1610612756: 'PHX',
    1610612757: 'POR', 1610612758: 'SAC', 1610612759: 'SAS',
    1610612761: 'TOR', 1610612762: 'UTA', 1610612764: 'WAS',
  };
  return abbrevMap[teamId] ?? '';
}
