import { PlayerCard } from "@/components/PlayerCard";
import { Panel } from "@/components/ui/Panel";
import type { SquadPlayer } from "@/lib/fpl/types";

type BenchProps = {
  bench: SquadPlayer[];
};

export function Bench({ bench }: BenchProps) {
  return (
    <Panel className="p-4 sm:p-5">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-white">Bench</h2>
          <p className="mt-1 text-xs text-white/45">Substitutes in squad order</p>
        </div>
        <span className="rounded-full bg-white/8 px-2.5 py-1 text-[11px] text-white/60">
          {bench.length} players
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {bench.map((player) => (
          <PlayerCard key={player.id} player={player} showFixture />
        ))}
      </div>
    </Panel>
  );
}
