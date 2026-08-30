import type { SquadPlayer } from "@/lib/fpl/types";

type CaptainCardProps = {
  captain: SquadPlayer | null;
  viceCaptain: SquadPlayer | null;
};

export function CaptainCard({ captain, viceCaptain }: CaptainCardProps) {
  return (
    <section className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200">
          Captain
        </p>
        <p className="mt-1 text-lg font-semibold text-white">
          {captain ? `⭐ ${captain.webName}` : "Not set"}
        </p>
        {captain?.nextFixture ? (
          <p className="mt-1 text-xs text-white/60">
            GW{captain.nextFixture.eventId}: {captain.nextFixture.opponentShortName} (
            {captain.nextFixture.isHome ? "H" : "A"})
          </p>
        ) : null}
      </div>
      <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
          Vice Captain
        </p>
        <p className="mt-1 text-lg font-semibold text-white">
          {viceCaptain?.webName ?? "Not set"}
        </p>
        {viceCaptain?.nextFixture ? (
          <p className="mt-1 text-xs text-white/60">
            GW{viceCaptain.nextFixture.eventId}: {viceCaptain.nextFixture.opponentShortName} (
            {viceCaptain.nextFixture.isHome ? "H" : "A"})
          </p>
        ) : null}
      </div>
    </section>
  );
}
