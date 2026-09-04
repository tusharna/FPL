import type { RiskLevel } from "@/lib/analysis/types";
import type { FplFixture, Player } from "@/lib/fpl/types";

export type FreshnessStatus = "FRESH" | "STALE" | "ERROR";

export type DataFreshness = {
  source: string;
  fetchedAt: string;
  expiresAt?: string;
  status: FreshnessStatus;
};

export type AvailabilitySignal = {
  playerId: number;
  risk: RiskLevel;
  reason: string;
  source: "FPL";
  confidence: number;
  detectedAt: string;
};

export type IntelligenceSource = {
  name: string;
  url?: string;
  publishedAt?: string;
  confidence: number;
};

export type PlayerIntelligence = {
  playerId: number;
  availability: {
    risk: RiskLevel;
    reason?: string;
    confidence: number;
  };
  suspension?: {
    active: boolean;
    reason?: string;
  };
  minutesRisk: RiskLevel;
  sources: IntelligenceSource[];
  uncertainty: RiskLevel;
};

export type NewsItem = {
  id: string;
  playerId?: number;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  relevance: RiskLevel;
  confidence: number;
};

export type IntelligenceConflict = {
  playerId: number;
  sources: IntelligenceSource[];
  resolution: "FPL_PRIMARY" | "MOST_RECENT" | "UNRESOLVED";
  explanation: string;
};

export type FixtureChangeType =
  | "TIME_CHANGE"
  | "POSTPONED"
  | "REARRANGED"
  | "BLANK"
  | "DOUBLE";

export type FixtureChange = {
  fixtureId: number;
  type: FixtureChangeType;
  previousValue?: string;
  newValue?: string;
  detectedAt: string;
};

export type FixtureIntelligence = {
  playerId: number;
  nextFixtures: {
    gameweek: number;
    opponent: string;
    difficulty: number;
    home: boolean;
  }[];
  fixtureChangeRisk: RiskLevel;
};

export type PriceSnapshot = {
  playerId: number;
  price: number;
  capturedAt: string;
};

export type PriceDirection = "RISING" | "FALLING" | "STABLE";

export type PriceSignal = {
  playerId: number;
  direction: PriceDirection;
  currentPrice: number;
  previousPrice?: number;
  confidence: number;
  reason: string;
};

export type DecisionArea =
  | "START_XI"
  | "BENCH"
  | "CAPTAIN"
  | "VICE_CAPTAIN"
  | "TRANSFER";

export type ImpactLevel = "NONE" | "LOW" | "MEDIUM" | "HIGH";

export type DecisionImpact = {
  playerId: number;
  impact: ImpactLevel;
  affectedAreas: DecisionArea[];
  reasons: string[];
};

export type IntelligenceAlert = {
  player: string;
  playerId: number;
  type: string;
  severity: RiskLevel;
  explanation: string;
};

export type IntelligenceBundle = {
  gameweekId: number;
  fetchedAt: string;
  freshness: DataFreshness[];
  availability: AvailabilitySignal[];
  players: PlayerIntelligence[];
  fixtureChanges: FixtureChange[];
  fixtureIntelligence: FixtureIntelligence[];
  priceSignals: PriceSignal[];
  news: NewsItem[];
  conflicts: IntelligenceConflict[];
  impacts: DecisionImpact[];
  keyAlerts: IntelligenceAlert[];
  shouldRecalculate: boolean;
  recalculationReason?: string;
  errors: string[];
};

export type IntelligencePipelineInput = {
  gameweekId: number;
  entryId: number;
  squad: Player[];
  allPlayers: Player[];
  fixtures: FplFixture[];
  teamsById: Map<number, { id: number; short_name: string }>;
  captainId?: number;
  viceCaptainId?: number;
  transferPlayerIds?: number[];
  recommendedXiIds?: number[];
  previousPlayers?: PlayerIntelligence[];
};
