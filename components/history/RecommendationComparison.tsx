import type { GameweekDetail } from "@/lib/history/types";
import { Badge } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/Panel";

type RecommendationComparisonProps = {
  detail: GameweekDetail;
};

function playerLabel(
  playerId: number | null | undefined,
  names: Record<number, string>,
): string {
  if (playerId == null) {
    return "—";
  }
  return names[playerId] ?? `Player ${playerId}`;
}

export function RecommendationComparison({ detail }: RecommendationComparisonProps) {
  const { recommendation, teamSnapshot, recommendationPlayers, playerNames, evaluation } =
    detail;

  const actualStarters = teamSnapshot
    .filter((row) => row.is_starting)
    .map((row) => playerLabel(row.player_id, playerNames));
  const recommendedStarters = recommendationPlayers
    .filter((row) => row.is_starting)
    .map((row) => playerLabel(row.player_id, playerNames));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel className="p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
          Actual team
        </p>
        <p className="mt-2 text-sm text-white/60">
          Formation from stored squad snapshot
        </p>
        <ul className="mt-4 space-y-2 text-sm text-white/80">
          {actualStarters.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </Panel>

      <Panel className="p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
            Model recommendation
          </p>
          {recommendation?.engine_version ? (
            <Badge tone="neutral">Engine {recommendation.engine_version}</Badge>
          ) : null}
        </div>
        <p className="mt-2 text-sm text-white/60">
          {recommendation?.recommended_formation ?? "No recommendation stored"}
        </p>
        <ul className="mt-4 space-y-2 text-sm text-white/80">
          {recommendedStarters.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </Panel>

      {evaluation ? (
        <Panel className="p-5 lg:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
            Performance
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-white/45">Actual XI</p>
              <p className="text-lg font-semibold text-white">
                {evaluation.actualTeamPoints}
              </p>
            </div>
            <div>
              <p className="text-xs text-white/45">Recommended XI</p>
              <p className="text-lg font-semibold text-white">
                {evaluation.recommendedTeamPoints}
              </p>
            </div>
            <div>
              <p className="text-xs text-white/45">Difference</p>
              <p className="text-lg font-semibold text-emerald-300">
                {evaluation.lineupDelta > 0 ? "+" : ""}
                {evaluation.lineupDelta}
              </p>
            </div>
            <div>
              <p className="text-xs text-white/45">Bench points</p>
              <p className="text-lg font-semibold text-white">
                {evaluation.benchPoints}
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs text-white/45">Captain</p>
              <p className="mt-2 text-sm text-white/80">
                Actual: {evaluation.actualCaptain.player} ({evaluation.actualCaptain.points})
              </p>
              <p className="mt-1 text-sm text-white/80">
                Recommended: {evaluation.recommendedCaptain.player} (
                {evaluation.recommendedCaptain.points})
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs text-white/45">Transfer</p>
              <p className="mt-2 text-sm text-white/80">{evaluation.transfer.action}</p>
              {evaluation.transfer.action === "TRANSFER" ? (
                <p className="mt-1 text-sm text-white/70">
                  {evaluation.transfer.playerOut} → {evaluation.transfer.playerIn}
                  {evaluation.transfer.transferImpact != null
                    ? ` · Impact ${evaluation.transfer.transferImpact > 0 ? "+" : ""}${evaluation.transfer.transferImpact}`
                    : ""}
                </p>
              ) : null}
            </div>
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
