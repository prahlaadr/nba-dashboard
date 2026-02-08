// NBA court dimensions in feet
export const COURT = {
  LENGTH: 94,
  WIDTH: 50,
  HALF_LENGTH: 47,

  // Paint / Key
  PAINT_WIDTH: 16,
  PAINT_LENGTH: 19,
  FREE_THROW_LINE: 19, // from baseline
  FREE_THROW_CIRCLE_RADIUS: 6,

  // 3-point line
  THREE_POINT_RADIUS: 23.75,
  THREE_POINT_CORNER_DISTANCE: 22, // corner 3 distance
  THREE_POINT_CORNER_Y: 14, // where arc meets corner line (ft from sideline center)

  // Restricted area
  RESTRICTED_RADIUS: 4,

  // Basket
  BASKET_FROM_BASELINE: 5.25,
  BASKET_DIAMETER: 1.5,
  BACKBOARD_WIDTH: 6,

  // Center circle
  CENTER_CIRCLE_RADIUS: 6,
} as const;

// NBA API coordinate system:
// LOC_X: -250 to 250 (tenths of feet from center of court, left-right)
// LOC_Y: -52 to ~418 (tenths of feet from basket, toward half court)
// Basket is at (0, 0) in NBA coords

// SVG viewport dimensions — we use NBA coordinate scale (tenths of feet)
// Half court: 500 wide (50ft) × 470 tall (47ft)
export const SVG = {
  WIDTH: 500,
  HEIGHT: 470,
  PADDING: 10,
} as const;

// PBP V3 action types
export const ACTION_TYPES = {
  MADE_SHOT: '2pt' as const,
  PERIOD_START: 'period' as const,
  JUMP_BALL: 'jumpball' as const,
  TURNOVER: 'turnover' as const,
  FOUL: 'foul' as const,
  FREE_THROW: 'freethrow' as const,
  REBOUND: 'rebound' as const,
  SUBSTITUTION: 'substitution' as const,
  TIMEOUT: 'timeout' as const,
  VIOLATION: 'violation' as const,
};

export const QUARTERS = [
  { label: 'Q1', startSeconds: 0 },
  { label: 'Q2', startSeconds: 720 },
  { label: 'Q3', startSeconds: 1440 },
  { label: 'Q4', startSeconds: 2160 },
] as const;

export const GAME_LENGTH_SECONDS = 2880; // 4 quarters × 12 min × 60 sec
