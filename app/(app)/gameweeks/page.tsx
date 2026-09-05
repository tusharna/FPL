import { GameweekTable } from "@/components/history/GameweekTable";
import { PerformanceMetrics } from "@/components/history/PerformanceMetrics";
import { Badge } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/Panel";
import { getAuthenticatedFplEntryId } from "@/lib/auth/user";
import { loadHistoryOverview } from "@/lib/history";
import { isDatabaseConfigured } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export default async function GameweeksPage() {
  if (!isDatabaseConfigured()) {
    return (
      <Panel className="p-6">
        <h1 className="text-2xl font-semibold text-white">History</h1>
        <p className="mt-3 text-sm text-white/70">
          Supabase is not configured. Add `NEXT_PUBLIC_SUPABASE_URL` and
          `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`, run the migrations in
          `supabase/migrations/`, then restart the app.
        </p>
      </Panel>
    );
  }

  const entryId = await getAuthenticatedFplEntryId();
  const overview = await loadHistoryOverview(entryId);

  return (
    <div className="flex flex-col gap-6">
      <header className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="mint">Phase 4</Badge>
          <Badge tone="neutral">Historical snapshots</Badge>
        </div>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
          Gameweek history
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-white/65">
          Stored recommendations, squad snapshots, AI reports, and post-deadline
          evaluation. Historical recommendations are never overwritten.
        </p>
      </header>

      {overview ? <PerformanceMetrics metrics={overview.metrics} /> : null}
      <GameweekTable rows={overview?.gameweeks ?? []} />
    </div>
  );
}
