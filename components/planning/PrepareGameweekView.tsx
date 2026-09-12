import Link from "next/link";
import { Analysis } from "@/components/Analysis";
import { IntelligencePanel } from "@/components/intelligence/IntelligencePanel";
import { DeadlineCountdown } from "@/components/planning/DeadlineCountdown";
import { Badge } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/Panel";
import { formatPrice } from "@/lib/format";
import type { NextGameweekPlanningData } from "@/lib/fpl/planning-data";

type PrepareGameweekViewProps = {
  data: NextGameweekPlanningData;
};

export function PrepareGameweekView({ data }: PrepareGameweekViewProps) {
  const { planningGameweek, analysis, intelligence, squad } = data;
  const playerNames = new Map(squad.map((player) => [player.id, player.webName]));
  const transfer = analysis.transferRecommendation;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3 px-1">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Prepare for {planningGameweek.name}
          </h2>
          <p className="mt-1 text-sm text-white/55">
            Recommendations based on your current FPL squad via My Team — not
            submitted picks from the live gameweek.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.planningContext.currentState === "IN_PROGRESS" &&
          data.planningContext.currentGameweek ? (
            <Badge tone="mint" dot>
              GW{data.planningContext.currentGameweek.id} LIVE
            </Badge>
          ) : null}
          <Badge tone="gold">Planning GW{planningGameweek.id}</Badge>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="p-5 lg:col-span-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
            Deadline
          </p>
          <div className="mt-3">
            <DeadlineCountdown deadline={planningGameweek.deadline} />
          </div>
        </Panel>

        <Panel className="p-5 lg:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
            Current squad baseline
          </p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-white/75">
            <span>Team value: {formatPrice(data.teamValue)}</span>
            <span>Bank: {formatPrice(data.bank)}</span>
            <span>{data.squad.length} players</span>
          </div>
          <p className="mt-2 text-xs text-white/45">
            Loaded from FPL My Team API at {new Date(data.generatedAt).toLocaleString("en-IN")}
          </p>
        </Panel>
      </div>

      <Panel className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
            Transfer decision
          </p>
          <Badge tone={transfer.action === "SAVE" ? "mint" : "gold"}>
            {transfer.action === "SAVE" ? "SAVE TRANSFER" : "TRANSFER"}
          </Badge>
        </div>
        {transfer.action === "TRANSFER" && transfer.playerOut && transfer.playerIn ? (
          <div className="mt-3 grid gap-2 text-sm text-white/80 sm:grid-cols-2">
            <p>
              <span className="text-rose-300">OUT:</span>{" "}
              {transfer.playerOut.webName} ({formatPrice(transfer.playerOut.price)})
            </p>
            <p>
              <span className="text-emerald-300">IN:</span>{" "}
              {transfer.playerIn.webName} ({formatPrice(transfer.playerIn.price)})
            </p>
            {transfer.score != null ? (
              <p className="sm:col-span-2 text-white/60">
                Expected gain: {transfer.score.toFixed(2)} pts
              </p>
            ) : null}
          </div>
        ) : (
          <p className="mt-3 text-sm text-white/70">
            No transfer recommended — hold your free transfer for now.
          </p>
        )}
      </Panel>

      <Analysis analysis={analysis} />

      <section className="flex flex-col gap-3">
        <h3 className="text-lg font-semibold text-white">Fixtures & intelligence</h3>
        <IntelligencePanel intelligence={intelligence} playerNames={playerNames} />
      </section>

      <Panel className="p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
          AI explanation
        </p>
        <p className="mt-3 text-sm text-white/70">
          Generate a narrative report on the{" "}
          <Link href="/report" className="text-emerald-300 underline-offset-2 hover:underline">
            Report
          </Link>{" "}
          page. AI explains engine decisions and never overrides captain, XI, or
          transfer recommendations.
        </p>
      </Panel>
    </div>
  );
}
