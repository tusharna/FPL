import { notFound } from "next/navigation";
import { ExecutiveSummary } from "@/components/report/ExecutiveSummary";
import { CaptainCard } from "@/components/report/CaptainCard";
import { RecommendedXI } from "@/components/report/RecommendedXI";
import { RiskList } from "@/components/report/RiskList";
import { TransferCard } from "@/components/report/TransferCard";
import { GameweekSummary } from "@/components/history/GameweekSummary";
import { RecommendationComparison } from "@/components/history/RecommendationComparison";
import { Badge } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/Panel";
import { loadGameweekDetail } from "@/lib/history";
import { isDatabaseConfigured } from "@/lib/db/client";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ gw: string }>;
};

export default async function GameweekDetailPage({ params }: PageProps) {
  if (!isDatabaseConfigured()) {
    notFound();
  }

  const { gw } = await params;
  const gameweekId = Number.parseInt(gw, 10);
  if (!Number.isFinite(gameweekId)) {
    notFound();
  }

  const detail = await loadGameweekDetail(gameweekId);
  if (!detail) {
    notFound();
  }

  const report = detail.report?.report_json;

  return (
    <GameweekSummary
      title={`Gameweek ${detail.gameweek.id}`}
      description={
        detail.gameweek.finished
          ? "Finished gameweek with stored recommendation and evaluation."
          : "Stored recommendation snapshot for the current or upcoming gameweek."
      }
    >
      <div className="flex flex-wrap gap-2">
        <Badge tone={detail.gameweek.finished ? "neutral" : "gold"}>
          {detail.gameweek.finished ? "Finished" : "Open"}
        </Badge>
        {detail.recommendation?.engine_version ? (
          <Badge tone="sky">Engine {detail.recommendation.engine_version}</Badge>
        ) : null}
        {detail.report ? (
          <Badge tone="mint">
            Report saved {detail.report.provider ?? "fallback"}
          </Badge>
        ) : null}
      </div>

      <RecommendationComparison detail={detail} />

      {report ? (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-white">AI report</h2>
          <p className="text-lg font-semibold text-white">{report.finalVerdict}</p>
          <CaptainCard report={report} />
          <RecommendedXI report={report} />
          <TransferCard report={report} />
          <RiskList report={report} />
          <ExecutiveSummary report={report} />
          <Panel className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
              Bench
            </p>
            <p className="mt-3 text-sm leading-6 text-white/75">{report.bench.explanation}</p>
          </Panel>
        </section>
      ) : (
        <Panel className="p-5">
          <p className="text-sm text-white/70">
            No AI report stored for this gameweek yet.
          </p>
        </Panel>
      )}
    </GameweekSummary>
  );
}
