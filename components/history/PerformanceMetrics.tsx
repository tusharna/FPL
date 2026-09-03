import type { HistoryMetrics } from "@/lib/history/metrics";
import { Panel } from "@/components/ui/Panel";
import { StatCard } from "@/components/ui/StatCard";
import { BarChart3, Crown, Shield, TrendingUp } from "lucide-react";

type PerformanceMetricsProps = {
  metrics: HistoryMetrics;
};

function formatRate(value: number | null): string {
  if (value == null) {
    return "—";
  }
  return `${Math.round(value * 100)}%`;
}

function formatNumber(value: number | null, suffix = ""): string {
  if (value == null) {
    return "—";
  }
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}${suffix}`;
}

export function PerformanceMetrics({ metrics }: PerformanceMetricsProps) {
  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Avg XI improvement"
        value={formatNumber(metrics.averageXiImprovement, " pts")}
        icon={TrendingUp}
        accent="text-emerald-300"
      />
      <StatCard
        label="Captain success rate"
        value={formatRate(metrics.captainSuccessRate)}
        icon={Crown}
        accent="text-amber-300"
      />
      <StatCard
        label="Positive transfer rate"
        value={formatRate(metrics.positiveTransferRate)}
        icon={BarChart3}
        accent="text-sky-300"
      />
      <StatCard
        label="Avg bench points"
        value={formatNumber(metrics.averageBenchPoints, " pts")}
        icon={Shield}
        accent="text-violet-300"
      />
      <Panel className="p-5 md:col-span-2 xl:col-span-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
          Season snapshot
        </p>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-white/75">
          <span>Evaluated gameweeks: {metrics.gameweeksEvaluated}</span>
          <span>
            Best GW: {metrics.bestGameweek != null ? `GW${metrics.bestGameweek}` : "—"}
          </span>
          <span>
            Worst GW: {metrics.worstGameweek != null ? `GW${metrics.worstGameweek}` : "—"}
          </span>
        </div>
      </Panel>
    </section>
  );
}
