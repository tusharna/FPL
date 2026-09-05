import { Layers } from "lucide-react";
import { PlayerCard } from "@/components/PlayerCard";
import { Panel } from "@/components/ui/Panel";
import type { SquadPlayer } from "@/lib/fpl/types";

type BenchProps = {
  bench: SquadPlayer[];
};

function getSlotBadge(player: SquadPlayer, index: number) {
  if (player.position === "GK") {
    return {
      label: "GK Sub",
      tone: "bg-amber-400/15 text-amber-300 ring-amber-400/25",
    };
  }
  const subNum = index; // 1st, 2nd, 3rd outfield
  return {
    label: `${subNum}${subNum === 1 ? "st" : subNum === 2 ? "nd" : "rd"} Sub`,
    tone:
      subNum === 1
        ? "bg-emerald-400/15 text-emerald-300 ring-emerald-400/25"
        : "bg-white/10 text-white/70 ring-white/15",
  };
}

export function Bench({ bench }: BenchProps) {
  return (
    <Panel className="p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/20 text-sky-300 ring-1 ring-sky-400/30">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white uppercase tracking-wider">
              Dugout & Substitutes
            </h2>
            <p className="text-[11px] text-white/50">Ordered by automatic substitution priority</p>
          </div>
        </div>
        <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/70 ring-1 ring-white/10">
          {bench.length} Reserves
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {bench.map((player, index) => {
          const slot = getSlotBadge(player, index);
          return (
            <div key={player.id} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between px-1">
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${slot.tone}`}
                >
                  {slot.label}
                </span>
                <span className="text-[10px] text-white/40 tabular-nums">
                  Priority {index + 1}
                </span>
              </div>
              <PlayerCard player={player} showFixture />
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

