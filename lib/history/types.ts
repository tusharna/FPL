import type { AIReport } from "@/lib/ai/types";
import type {
  ActualResultRow,
  GameweekRow,
  PlayerSnapshotRow,
  RecommendationPlayerRow,
  RecommendationRow,
  ReportRow,
  TeamSnapshotRow,
} from "@/lib/db/schema";
import type { RecommendationEvaluation } from "./evaluate";
import type { HistoryMetrics } from "./metrics";

export type PersistResult = {
  recommendationId: number;
  gameweekId: number;
  created: boolean;
  reportSaved: boolean;
};

export type GameweekHistorySummary = {
  gameweek: GameweekRow;
  recommendation: RecommendationRow | null;
  evaluation: RecommendationEvaluation | null;
  hasReport: boolean;
};

export type HistoryOverview = {
  entryId: number;
  gameweeks: GameweekHistorySummary[];
  metrics: HistoryMetrics;
};

export type GameweekDetail = {
  entryId: number;
  gameweek: GameweekRow;
  recommendation: RecommendationRow | null;
  recommendationPlayers: RecommendationPlayerRow[];
  teamSnapshot: TeamSnapshotRow[];
  playerSnapshots: PlayerSnapshotRow[];
  actualResults: ActualResultRow[];
  report: ReportRow | null;
  evaluation: RecommendationEvaluation | null;
  playerNames: Record<number, string>;
};

export type PersistReportOptions = {
  provider?: string;
  model?: string;
  allPlayers: import("@/lib/fpl/types").Player[];
};

export type StoredReportPayload = {
  report: AIReport;
  provider: string | null;
  model: string | null;
};
