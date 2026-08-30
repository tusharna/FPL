import { PlayerCard } from "@/components/PlayerCard";
import type { Position, SquadPlayer } from "@/lib/fpl/types";

const PITCH_ROWS: Position[] = ["GK", "DEF", "MID", "FWD"];

type PitchProps = {
  startingXi: SquadPlayer[];
};

export function Pitch({ startingXi }: PitchProps) {
  const rows = PITCH_ROWS.map((position) => ({
    position,
    players: startingXi.filter((player) => player.position === position),
  })).filter((row) => row.players.length > 0);

  return (
    <section className="overflow-hidden rounded-2xl border border-emerald-900/40 bg-pitch">
      <div className="flex flex-col justify-between gap-6 px-3 py-8 sm:px-6 sm:py-10">
        {rows.map((row) => (
          <div
            key={row.position}
            className="flex flex-wrap items-start justify-center gap-3 sm:gap-4"
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
    </section>
  );
}
