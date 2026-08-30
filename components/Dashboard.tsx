import { Bench } from "@/components/Bench";
import { CaptainCard } from "@/components/CaptainCard";
import { Pitch } from "@/components/Pitch";
import { Squad } from "@/components/Squad";
import { formatDeadline, formatPrice, formatRank } from "@/lib/format";
import type { DashboardData } from "@/lib/fpl/types";

type DashboardProps = {
  data: DashboardData;
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/40">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

export function Dashboard({ data }: DashboardProps) {
  const { manager, gameweek } = data;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-300">
            FPL Report
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Gameweek {gameweek.relevant.id}
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Deadline: {formatDeadline(gameweek.deadline)}
            {gameweek.isFinished ? " · Finished" : ""}
          </p>
          <p className="mt-1 text-sm text-white/50">
            {manager.teamName} · {manager.managerName}
          </p>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Team value" value={formatPrice(manager.teamValue)} />
        <Stat label="Bank" value={formatPrice(manager.bank)} />
        <Stat label="Total points" value={String(manager.totalPoints)} />
        <Stat label="Overall rank" value={formatRank(manager.overallRank)} />
        <Stat label="Gameweek points" value={String(manager.gameweekPoints)} />
      </section>

      <CaptainCard captain={data.captain} viceCaptain={data.viceCaptain} />

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
          Your team
        </h2>
        <Pitch startingXi={data.startingXi} />
      </section>

      <Bench bench={data.bench} />
      <Squad startingXi={data.startingXi} />
    </div>
  );
}
