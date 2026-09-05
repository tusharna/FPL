import { Crown, ShieldAlert, Sparkles } from "lucide-react";
import { Fixture } from "@/components/Fixture";
import { Badge } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/Panel";
import { formatPoints, formatPrice } from "@/lib/format";
import type { SquadPlayer } from "@/lib/fpl/types";

type CaptainCardProps = {
  captain: SquadPlayer | null;
  viceCaptain: SquadPlayer | null;
};

export function CaptainCard({ captain, viceCaptain }: CaptainCardProps) {
  return (
    <Panel className="p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400/20 text-amber-300 ring-1 ring-amber-400/30">
            <Crown className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white uppercase tracking-wider">
              Captaincy Command
            </h2>
            <p className="text-[11px] text-white/50">Primary and backup armbands for this Gameweek</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Star Captain Tile */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-400/30 bg-linear-to-br from-amber-400/12 via-amber-400/[0.04] to-transparent p-5 shadow-[0_16px_36px_rgba(251,191,36,0.12)] backdrop-blur-xl before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-linear-to-r before:from-transparent before:via-amber-400/50 before:to-transparent">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[11px] font-black text-slate-950 shadow-sm">
                C
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300">
                Captain
              </span>
            </div>
            <Badge tone="gold">
              <Sparkles className="h-3 w-3" />
              2x Points Active
            </Badge>
          </div>

          {captain ? (
            <div className="mt-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h3 className="text-2xl font-bold tracking-tight text-white">
                    {captain.webName}
                  </h3>
                  <p className="text-xs text-white/50">
                    {captain.position} · {captain.teamName}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-semibold text-white/40">Expected</span>
                  <p className="text-lg font-bold text-amber-300 tabular-nums">
                    {(captain.expectedPointsNext * 2).toFixed(1)} xPts
                  </p>
                </div>
              </div>

              {/* Stats pill grid */}
              <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-950/50 p-2.5 ring-1 ring-white/10">
                <div className="text-center">
                  <span className="text-[9px] uppercase font-semibold text-white/40">Price</span>
                  <p className="text-xs font-bold text-white tabular-nums">{formatPrice(captain.price)}</p>
                </div>
                <div className="text-center border-x border-white/10">
                  <span className="text-[9px] uppercase font-semibold text-white/40">Form</span>
                  <p className="text-xs font-bold text-emerald-300 tabular-nums">{formatPoints(captain.form)}</p>
                </div>
                <div className="text-center">
                  <span className="text-[9px] uppercase font-semibold text-white/40">GW Score</span>
                  <p className="text-xs font-bold text-amber-300 tabular-nums">{captain.eventPoints * 2} pts</p>
                </div>
              </div>

              {/* Next Match */}
              <div className="mt-3.5 flex items-center justify-between border-t border-white/[0.08] pt-3">
                <span className="text-[10px] uppercase font-semibold text-white/40">Upcoming Fixture</span>
                <Fixture fixture={captain.nextFixture} />
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-white/40 italic">No captain currently designated</p>
          )}
        </div>

        {/* Vice Captain Tile */}
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.12] bg-linear-to-br from-white/[0.06] via-white/[0.02] to-transparent p-5 shadow-[0_16px_36px_rgba(0,0,0,0.2)] backdrop-blur-xl before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-linear-to-r before:from-transparent before:via-white/30 before:to-transparent">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[11px] font-black text-slate-900 shadow-sm">
                V
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
                Vice Captain
              </span>
            </div>
            <Badge tone="neutral">
              <ShieldAlert className="h-3 w-3 text-white/60" />
              Backup Armband
            </Badge>
          </div>

          {viceCaptain ? (
            <div className="mt-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h3 className="text-2xl font-bold tracking-tight text-white">
                    {viceCaptain.webName}
                  </h3>
                  <p className="text-xs text-white/50">
                    {viceCaptain.position} · {viceCaptain.teamName}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-semibold text-white/40">Expected</span>
                  <p className="text-lg font-bold text-white tabular-nums">
                    {formatPoints(viceCaptain.expectedPointsNext)} xPts
                  </p>
                </div>
              </div>

              {/* Stats pill grid */}
              <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-950/50 p-2.5 ring-1 ring-white/10">
                <div className="text-center">
                  <span className="text-[9px] uppercase font-semibold text-white/40">Price</span>
                  <p className="text-xs font-bold text-white tabular-nums">{formatPrice(viceCaptain.price)}</p>
                </div>
                <div className="text-center border-x border-white/10">
                  <span className="text-[9px] uppercase font-semibold text-white/40">Form</span>
                  <p className="text-xs font-bold text-emerald-300 tabular-nums">{formatPoints(viceCaptain.form)}</p>
                </div>
                <div className="text-center">
                  <span className="text-[9px] uppercase font-semibold text-white/40">GW Score</span>
                  <p className="text-xs font-bold text-white tabular-nums">{viceCaptain.eventPoints} pts</p>
                </div>
              </div>

              {/* Next Match */}
              <div className="mt-3.5 flex items-center justify-between border-t border-white/[0.08] pt-3">
                <span className="text-[10px] uppercase font-semibold text-white/40">Upcoming Fixture</span>
                <Fixture fixture={viceCaptain.nextFixture} />
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-white/40 italic">No vice-captain designated</p>
          )}
        </div>
      </div>
    </Panel>
  );
}

