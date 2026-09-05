import { Shield, Sparkles } from "lucide-react";
import { PlayerCard } from "@/components/PlayerCard";
import type { Position, SquadPlayer } from "@/lib/fpl/types";

const PITCH_ROWS: Position[] = ["GK", "DEF", "MID", "FWD"];

type PitchProps = {
  startingXi: SquadPlayer[];
};

export function Pitch({ startingXi }: PitchProps) {
  const defCount = startingXi.filter((p) => p.position === "DEF").length;
  const midCount = startingXi.filter((p) => p.position === "MID").length;
  const fwdCount = startingXi.filter((p) => p.position === "FWD").length;
  const formation = `${defCount}-${midCount}-${fwdCount}`;

  const totalStartingXpts = startingXi
    .reduce((sum, p) => sum + (p.expectedPointsNext || 0) * (p.multiplier || 1), 0)
    .toFixed(1);

  const rows = PITCH_ROWS.map((position) => ({
    position,
    players: startingXi.filter((player) => player.position === position),
  })).filter((row) => row.players.length > 0);

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-emerald-500/25 bg-[#082012] shadow-[0_32px_90px_rgba(0,0,0,0.65)]">
      {/* Tactical pitch header bar */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] bg-slate-950/70 px-5 py-3.5 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Starting XI Pitch
            </h3>
            <p className="text-[10px] text-white/50">Matchday lineup</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300 ring-1 ring-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {formation} Formation
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/70 ring-1 ring-white/10">
            <Sparkles className="h-3 w-3 text-cyan-300" />
            {totalStartingXpts} XI xPts
          </span>
        </div>
      </div>

      {/* Realistic Stadium Pitch Canvas */}
      <div className="tactical-pitch relative min-h-[38rem] py-6 sm:py-10">
        {/* Authentic field markings */}
        <div className="pitch-boundary" />
        <div className="pitch-halfway" />
        <div className="pitch-center-circle" />
        <div className="pitch-center-spot" />
        <div className="pitch-penalty-top" />
        <div className="pitch-goal-top" />
        <div className="pitch-penalty-bottom" />
        <div className="pitch-goal-bottom" />
        <div className="pitch-corner-tl" />
        <div className="pitch-corner-tr" />
        <div className="pitch-corner-bl" />
        <div className="pitch-corner-br" />

        {/* Stadium lighting vignette overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.35)_100%)]" />

        {/* Players on pitch */}
        <div className="relative z-10 flex min-h-[38rem] flex-col justify-between gap-6 px-3 sm:px-6">
          {rows.map((row) => (
            <div
              key={row.position}
              className="flex flex-wrap items-start justify-center gap-3 sm:gap-6"
            >
              {row.players.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  compact
                  showFixture
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

