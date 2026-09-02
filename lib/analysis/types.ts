import type { Position } from "@/lib/fpl/types";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type PlayerAnalysis = {
  playerId: number;
  name: string;
  webName: string;
  position: Position;
  teamId: number;
  teamShortName: string;
  price: number;
  form: number;
  totalPoints: number;
  pointsPerGame: number;
  expectedPointsNext: number;
  expectedGoals: number;
  expectedAssists: number;
  expectedGoalInvolvement: number;
  minutes: number;
  starts: number;
  ownership: number;
  chanceOfPlaying: number | null;
  chanceOfPlayingThis: number | null;
  news: string;
  penaltiesOrder: number | null;
  fixtureScore: number;
  fixtureScoreMedium: number;
  availabilityRisk: number;
  minutesRisk: number;
  minutesSecurity: number;
  overallScore: number;
  transferScore: number;
};

export type RolePick = {
  player: PlayerAnalysis;
  score: number;
  reasons: string[];
};

export type LineupChange = {
  playerIn: PlayerAnalysis;
  playerOut: PlayerAnalysis;
};

export type PlayerRisk = {
  player: PlayerAnalysis;
  risk: RiskLevel;
  reasons: string[];
};

export type TransferRecommendation = {
  action: "SAVE" | "TRANSFER";
  playerOut?: PlayerAnalysis;
  playerIn?: PlayerAnalysis;
  score?: number;
  reasons: string[];
};

export type TransferCandidate = {
  playerOut: PlayerAnalysis;
  playerIn: PlayerAnalysis;
  gain: number;
  reasons: string[];
};

export type FixtureOutlook = {
  playerId: number;
  name: string;
  position: Position;
  fixtureScore: number;
  fixtureScoreMedium: number;
  summary: string;
};

export type GameweekAnalysis = {
  gameweek: number;
  recommendedFormation: string;
  recommendedXI: PlayerAnalysis[];
  benchOrder: PlayerAnalysis[];
  captain: RolePick;
  viceCaptain: RolePick;
  lineupChanges: LineupChange[];
  playerRisks: PlayerRisk[];
  transferRecommendation: TransferRecommendation;
  topTransferCandidates: TransferCandidate[];
  fixtureOutlook: FixtureOutlook[];
  generatedAt: string;
};
