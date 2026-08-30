import { PlayerCard } from "@/components/PlayerCard";
import type { SquadPlayer } from "@/lib/fpl/types";

type BenchProps = {
  bench: SquadPlayer[];
};

export function Bench({ bench }: BenchProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
        Bench
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {bench.map((player) => (
          <PlayerCard key={player.id} player={player} showFixture />
        ))}
      </div>
    </section>
  );
}
