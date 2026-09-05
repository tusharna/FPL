import type { ReactNode } from "react";
import {
  Banknote,
  CalendarClock,
  CheckCircle2,
  Sparkles,
  Trophy,
  UserRound,
  Wallet,
} from "lucide-react";
import { DashboardNav } from "@/components/DashboardNav";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { formatDeadline, formatPrice, formatRank } from "@/lib/format";
import type { DashboardPayload } from "@/lib/fpl/dashboard-data";

type DashboardShellProps = {
  data: DashboardPayload;
  children: ReactNode;
};

export function DashboardShell({ data, children }: DashboardShellProps) {
  const { manager, gameweek } = data;

  // Manager avatar initials
  const initials = manager.managerName
    ? manager.managerName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "FP";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Header Card */}
      <header className="relative overflow-hidden rounded-3xl border border-white/[0.09] bg-white/[0.03] p-6 shadow-[0_24px_64px_rgba(0,0,0,0.4)] backdrop-blur-2xl before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-linear-to-r before:from-transparent before:via-white/25 before:to-transparent sm:p-8">
        {/* Ambient background glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            {/* Top Badge Row */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300 ring-1 ring-emerald-500/30">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                FPL Command Center
              </div>
              <Badge
                tone={gameweek.isFinished ? "neutral" : "mint"}
                size="md"
                dot
              >
                {gameweek.isFinished ? "Gameweek Finished" : "Live Gameweek Window"}
              </Badge>
            </div>

            {/* Main Gameweek Heading */}
            <h1 className="mt-3.5 text-4xl font-black tracking-tight text-white sm:text-5xl">
              Gameweek {gameweek.relevant.id}
            </h1>

            {/* Manager Details & Deadline */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-white/70">
              <div className="flex items-center gap-2 rounded-full bg-white/[0.05] py-1 pl-1 pr-3 ring-1 ring-white/10">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-linear-to-tr from-emerald-400 to-cyan-400 text-[10px] font-black text-slate-950">
                  {initials}
                </div>
                <span className="font-bold text-white">{manager.teamName}</span>
                <span className="text-white/40">·</span>
                <span className="text-white/60">{manager.managerName}</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              </div>

              <div className="flex items-center gap-1.5 rounded-full bg-white/[0.05] px-3 py-1.5 ring-1 ring-white/10">
                <CalendarClock className="h-3.5 w-3.5 text-emerald-300" />
                <span className="text-white/50">Deadline:</span>
                <span className="font-semibold text-white">
                  {formatDeadline(gameweek.deadline)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Info Box */}
          <div className="max-w-sm rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.06] p-4 text-xs text-emerald-100/90 backdrop-blur-md shadow-[0_8px_24px_rgba(16,185,129,0.1)]">
            <p className="font-semibold text-emerald-300">Live Team Snapshot</p>
            <p className="mt-1 leading-relaxed text-emerald-100/75">
              Live squad picks, deterministic decision engine recommendations, and AI tactical insights synced with the official FPL engine.
            </p>
          </div>
        </div>
      </header>

      {/* Primary Key Metric Stat Cards */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Team value"
          value={formatPrice(manager.teamValue)}
          icon={Wallet}
          accent="text-emerald-300"
        />
        <StatCard
          label="In Bank"
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
          label="Gameweek pts"
          value={String(manager.gameweekPoints)}
          icon={Trophy}
          accent="text-cyan-300"
        />
      </section>

      {/* Navigation Bar */}
      <DashboardNav />

      {/* Main Content Area */}
      <main className="min-h-[26rem]">{children}</main>
    </div>
  );
}

