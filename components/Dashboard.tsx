import { Banknote, CalendarClock, Trophy, UserRound, Wallet } from "lucide-react";
import { Bench } from "@/components/Bench";
import { CaptainCard } from "@/components/CaptainCard";
import { Pitch } from "@/components/Pitch";
import { Squad } from "@/components/Squad";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { formatDeadline, formatPrice, formatRank } from "@/lib/format";
import type { DashboardData } from "@/lib/fpl/types";

type DashboardProps = {
  data: DashboardData;
};

export function Dashboard({ data }: DashboardProps) {
  const { manager, gameweek } = data;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="mint">FPL Report</Badge>
              <Badge tone={gameweek.isFinished ? "neutral" : "gold"}>
                {gameweek.isFinished ? "Finished" : "Live window"}
              </Badge>
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Gameweek {gameweek.relevant.id}
            </h1>
            <p className="mt-3 flex items-center gap-2 text-sm text-white/65">
              <CalendarClock className="h-4 w-4 text-emerald-300" />
              Deadline: {formatDeadline(gameweek.deadline)}
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm text-white/50">
              <UserRound className="h-4 w-4" />
              {manager.teamName} · {manager.managerName}
            </p>
          </div>
          <div className="max-w-sm rounded-2xl border border-emerald-300/15 bg-emerald-400/8 px-4 py-3 text-sm text-emerald-100/90">
            Your 15-player squad, formation, captaincy, and next fixtures — mapped live from the FPL API.
          </div>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard
          label="Team value"
          value={formatPrice(manager.teamValue)}
          icon={Wallet}
        />
        <StatCard
          label="Bank"
          value={formatPrice(manager.bank)}
          icon={Banknote}
          accent="text-sky-300"
        />
        <StatCard
          label="Total points"
          value={String(manager.totalPoints)}
          icon={Trophy}
          accent="text-amber-300"
        />
        <StatCard
          label="Overall rank"
          value={formatRank(manager.overallRank)}
          icon={UserRound}
          accent="text-violet-300"
        />
        <StatCard
          label="Gameweek points"
          value={String(manager.gameweekPoints)}
          icon={Trophy}
          accent="text-emerald-200"
        />
      </section>

      <CaptainCard captain={data.captain} viceCaptain={data.viceCaptain} />

      <section className="space-y-3">
        <div className="flex items-end justify-between px-1">
          <div>
            <h2 className="text-sm font-semibold text-white">Your team</h2>
            <p className="mt-1 text-xs text-white/45">
              Formation is generated from the selected XI
            </p>
          </div>
        </div>
        <Pitch startingXi={data.startingXi} />
      </section>

      <Bench bench={data.bench} />
      <Squad startingXi={data.startingXi} />
    </div>
  );
}
