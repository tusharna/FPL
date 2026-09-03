import type { RecommendationEvaluation } from "./evaluate";

export type HistoryMetrics = {
  gameweeksEvaluated: number;
  averageXiImprovement: number | null;
  captainSuccessRate: number | null;
  positiveTransferRate: number | null;
  averageBenchPoints: number | null;
  bestGameweek: number | null;
  worstGameweek: number | null;
};

export function computeHistoryMetrics(
  evaluations: RecommendationEvaluation[],
): HistoryMetrics {
  if (evaluations.length === 0) {
    return {
      gameweeksEvaluated: 0,
      averageXiImprovement: null,
      captainSuccessRate: null,
      positiveTransferRate: null,
      averageBenchPoints: null,
      bestGameweek: null,
      worstGameweek: null,
    };
  }

  const lineupDeltas = evaluations.map((row) => row.lineupDelta);
  const captainResults = evaluations.map((row) => row.captainCorrect);
  const transferResults = evaluations
    .filter((row) => row.transfer.action === "TRANSFER")
    .map((row) => row.transferPositive === true);
  const benchPoints = evaluations.map((row) => row.benchPoints);

  const average = (values: number[]) =>
    values.reduce((sum, value) => sum + value, 0) / values.length;

  const best = evaluations.reduce((current, row) =>
    row.lineupDelta > current.lineupDelta ? row : current,
  );
  const worst = evaluations.reduce((current, row) =>
    row.lineupDelta < current.lineupDelta ? row : current,
  );

  return {
    gameweeksEvaluated: evaluations.length,
    averageXiImprovement: average(lineupDeltas),
    captainSuccessRate:
      captainResults.filter(Boolean).length / captainResults.length,
    positiveTransferRate:
      transferResults.length === 0
        ? null
        : transferResults.filter(Boolean).length / transferResults.length,
    averageBenchPoints: average(benchPoints),
    bestGameweek: best.gameweek,
    worstGameweek: worst.gameweek,
  };
}
