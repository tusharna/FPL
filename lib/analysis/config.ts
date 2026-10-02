export const ENGINE_VERSION = "2.1.0";

export const SHORT_TERM_HORIZON = 1;
export const MEDIUM_TERM_HORIZON = 5;
export const FIXTURE_HORIZON = 3;
export const MINIMUM_TRANSFER_GAIN = 0.12;
/** Larger score gap required before recommending a move that costs a 4-point hit. */
export const HIT_TRANSFER_GAIN = 0.45;
export const HIT_COST_POINTS = 4;
export const MAX_BANKED_FREE_TRANSFERS = 5;
export const MAX_PLAYERS_PER_CLUB = 3;

export const PLAYER_SCORE_WEIGHTS = {
  expectedPoints: 0.3,
  fixtureQuality: 0.2,
  form: 0.12,
  minutesSecurity: 0.16,
  attackingPotential: 0.12,
  availability: 0.1,
} as const;

export const TRANSFER_SCORE_WEIGHTS = {
  expectedPoints: 0.22,
  fixtureQuality: 0.16,
  form: 0.1,
  minutesSecurity: 0.14,
  expectedGoalInvolvement: 0.12,
  value: 0.08,
  mediumTermFixtures: 0.1,
  availability: 0.08,
} as const;

export const CAPTAIN_SCORE_WEIGHTS = {
  expectedPoints: 0.28,
  fixture: 0.16,
  expectedGoals: 0.1,
  expectedAssists: 0.08,
  expectedGoalInvolvement: 0.12,
  minutesSecurity: 0.12,
  form: 0.08,
  availability: 0.04,
  setPieces: 0.02,
} as const;
