import type { IntelligenceBundle } from "@/lib/intelligence/types";
import { AvailabilityAlerts } from "@/components/intelligence/AvailabilityAlerts";
import { DataFreshnessPanel } from "@/components/intelligence/DataFreshness";
import { FixtureChanges } from "@/components/intelligence/FixtureChanges";
import { NewsAlerts } from "@/components/intelligence/NewsAlerts";
import { PriceChanges } from "@/components/intelligence/PriceChanges";
import { Badge } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/Panel";
import { formatFreshnessAge } from "@/lib/intelligence/freshness";
import { formatDateTime } from "@/lib/format";

type IntelligencePanelProps = {
  intelligence: IntelligenceBundle;
  playerNames?: Map<number, string>;
};

export function IntelligencePanel({ intelligence, playerNames }: IntelligencePanelProps) {
  const captainImpact = intelligence.impacts.some(
    (impact) =>
      impact.impact !== "NONE" &&
      impact.affectedAreas.includes("CAPTAIN"),
  );
  const transferImpact = intelligence.impacts.some(
    (impact) =>
      impact.impact !== "NONE" &&
      impact.affectedAreas.includes("TRANSFER"),
  );

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3 px-1">
        <div>
          <h2 className="text-lg font-semibold text-white">Live intelligence</h2>
          <p className="mt-1 text-xs text-white/45">
            FPL remains primary. Intelligence supplements availability, fixtures, prices, and news.
          </p>
        </div>
        <Badge tone="mint">
          Updated {formatFreshnessAge(intelligence.fetchedAt)} · {formatDateTime(intelligence.fetchedAt)}
        </Badge>
      </div>

      {intelligence.errors.length > 0 ? (
        <Panel className="p-5">
          <ul className="space-y-2 text-sm text-amber-100">
            {intelligence.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </Panel>
      ) : null}

      {intelligence.shouldRecalculate ? (
        <div className="rounded-2xl border border-sky-300/20 bg-sky-300/10 px-4 py-3 text-sm text-sky-100">
          Meaningful intelligence change detected. Phase 2 analysis was re-run with supplementary
          availability context. {intelligence.recalculationReason}
        </div>
      ) : null}

      <DataFreshnessPanel items={intelligence.freshness} />

      <div className="grid gap-4 lg:grid-cols-2">
        <AvailabilityAlerts
          signals={intelligence.availability}
          playerNames={playerNames}
        />
        <FixtureChanges changes={intelligence.fixtureChanges} />
      </div>

      <PriceChanges signals={intelligence.priceSignals} playerNames={playerNames} />
      <NewsAlerts news={intelligence.news} alerts={intelligence.keyAlerts} />

      <Panel className="p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
          Decision impact summary
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <p className="text-sm text-white/75">
            Captain affected:{" "}
            <span className="font-semibold text-white">{captainImpact ? "YES" : "NO"}</span>
          </p>
          <p className="text-sm text-white/75">
            Transfer affected:{" "}
            <span className="font-semibold text-white">{transferImpact ? "YES" : "NO"}</span>
          </p>
        </div>
      </Panel>
    </section>
  );
}
