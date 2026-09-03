"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CaptainCard } from "@/components/report/CaptainCard";
import { ExecutiveSummary } from "@/components/report/ExecutiveSummary";
import { RecommendedXI } from "@/components/report/RecommendedXI";
import { RiskList } from "@/components/report/RiskList";
import { TransferCard } from "@/components/report/TransferCard";
import { Badge } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/Panel";
import type { AIReport, ReportResult } from "@/lib/ai/types";

type ReportResponse = ReportResult & {
  gameweek?: number;
  error?: string;
  persisted?: {
    recommendationId: number;
    gameweekId: number;
    created: boolean;
    reportSaved: boolean;
  } | null;
};

export function GameweekReport() {
  const [loading, setLoading] = useState(false);
  const [loadingStored, setLoadingStored] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReportResponse | null>(null);

  useEffect(() => {
    async function loadStored() {
      try {
        const response = await fetch("/api/report?stored=true");
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as ReportResponse;
        if (payload.report) {
          setResult(payload);
        }
      } finally {
        setLoadingStored(false);
      }
    }

    void loadStored();
  }, []);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/report");
      const payload = (await response.json()) as ReportResponse;
      if (!response.ok || !payload.report) {
        setError(
          payload.error ??
            "AI report unavailable. The deterministic FPL analysis is still available.",
        );
        return;
      }
      setResult(payload);
    } catch {
      setError(
        "AI report unavailable. The deterministic FPL analysis is still available.",
      );
    } finally {
      setLoading(false);
    }
  }

  const report: AIReport | undefined = result?.report;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3 px-1">
        <div>
          <h2 className="text-lg font-semibold text-white">Gameweek report</h2>
          <p className="mt-1 text-xs text-white/45">
            AI explains the engine. It cannot change XI, captain, or transfer decisions.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void generate()}
          disabled={loading || loadingStored}
          className="rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Generating… (up to 1 min)"
            : loadingStored
              ? "Loading…"
              : "Generate Report"}
        </button>
      </div>

      {result?.persisted ? (
        <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
          Snapshot saved to history
          {result.persisted.created ? " (new recommendation)" : " (existing recommendation preserved)"}.
          {" "}
          <Link href="/gameweeks" className="underline">
            View history
          </Link>
        </div>
      ) : null}

      {error ? (
        <Panel className="p-5">
          <p className="text-sm text-amber-200">{error}</p>
        </Panel>
      ) : null}

      {result?.notice ? (
        <div className="rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
          {result.notice}
        </div>
      ) : null}

      {report ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Badge tone="mint">
              Gameweek {result?.gameweek ?? ""} report
            </Badge>
            <Badge tone={result?.source === "ai" ? "sky" : "neutral"}>
              {result?.source === "ai" ? "AI explanation" : "Deterministic fallback"}
            </Badge>
          </div>
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
          {report.lineupChanges.summary ? (
            <Panel className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
                Lineup changes
              </p>
              <p className="mt-3 text-sm text-white/75">{report.lineupChanges.summary}</p>
              {report.lineupChanges.changes.length > 0 ? (
                <ul className="mt-3 space-y-2 text-sm text-white/70">
                  {report.lineupChanges.changes.map((change) => (
                    <li key={`${change.playerOut}-${change.playerIn}`}>
                      {change.playerOut} → Bench · {change.playerIn} → Starting XI.{" "}
                      {change.explanation}
                    </li>
                  ))}
                </ul>
              ) : null}
            </Panel>
          ) : null}
          <div className="grid gap-3 lg:grid-cols-2">
            <Panel className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
                Short term
              </p>
              <p className="mt-3 text-sm leading-6 text-white/75">{report.shortTerm}</p>
            </Panel>
            <Panel className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
                Medium term
              </p>
              <p className="mt-3 text-sm leading-6 text-white/75">{report.mediumTerm}</p>
            </Panel>
          </div>
          <Panel className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
              Final verdict
            </p>
            <p className="mt-3 text-sm leading-6 text-white/75">{report.finalVerdict}</p>
          </Panel>
        </div>
      ) : null}
    </section>
  );
}
