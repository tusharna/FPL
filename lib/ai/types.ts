import type { Confidence, RiskLevel } from "@/lib/analysis/types";
import type { Position } from "@/lib/fpl/types";

export type PlayerSummary = {
  id: number;
  name: string;
  position: Position;
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
  chanceOfPlaying?: number;
  news?: string;
  fixtureScore: number;
  availabilityRisk: RiskLevel;
  minutesRisk: RiskLevel;
  overallScore: number;
};

export type AIReportInput = {
  gameweek: number;
  currentTeam: {
    startingXI: PlayerSummary[];
    bench: PlayerSummary[];
    formation: string;
  };
  recommendation: {
    formation: string;
    startingXI: PlayerSummary[];
    benchOrder: PlayerSummary[];
  };
  captain: {
    name: string;
    score: number;
    reasons: string[];
    confidence: Confidence;
  };
  viceCaptain: {
    name: string;
    score: number;
    reasons: string[];
  };
  lineupChanges: {
    playerIn: PlayerSummary;
    playerOut: PlayerSummary;
  }[];
  transferRecommendation: {
    action: "SAVE" | "TRANSFER";
    playerOut?: PlayerSummary;
    playerIn?: PlayerSummary;
    score?: number;
    reasons: string[];
  };
  risks: {
    player: PlayerSummary;
    risk: RiskLevel;
    reasons: string[];
  }[];
  shortTerm: {
    gameweeks: number;
    summary: string;
  };
  mediumTerm: {
    gameweeks: number;
    summary: string;
  };
  intelligence?: {
    freshness: {
      source: string;
      fetchedAt: string;
      expiresAt?: string;
      status: "FRESH" | "STALE" | "ERROR";
    }[];
    keyAlerts: {
      player: string;
      type: string;
      severity: "LOW" | "MEDIUM" | "HIGH";
      explanation: string;
    }[];
  };
};

export type AIReport = {
  title: string;
  executiveSummary: string;
  recommendedXI: {
    formation: string;
    explanation: string;
  };
  captain: {
    player: string;
    explanation: string;
    confidence: Confidence;
  };
  viceCaptain: {
    player: string;
    explanation: string;
  };
  lineupChanges: {
    summary: string;
    changes: {
      playerIn: string;
      playerOut: string;
      explanation: string;
    }[];
  };
  transfer: {
    action: "SAVE" | "TRANSFER";
    explanation: string;
  };
  bench: {
    explanation: string;
  };
  risks: {
    player: string;
    risk: RiskLevel;
    explanation: string;
  }[];
  shortTerm: string;
  mediumTerm: string;
  finalVerdict: string;
};

export type ReportSource = "ai" | "fallback";

export type ReportResult = {
  report: AIReport;
  source: ReportSource;
  notice?: string;
};

export interface AIProvider {
  generateReport(input: AIReportInput, correction?: string): Promise<AIReport>;
}
