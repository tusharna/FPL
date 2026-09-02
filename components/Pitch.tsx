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
    <section className="relative overflow-hidden rounded-[1.75rem] border border-emerald-300/20 shadow-[0_30px_80px_rgba(5,46,22,0.55)]">
      <div className="bg-pitch min-h-[34rem]">
        <div className="relative z-10 flex min-h-[34rem] flex-col justify-between gap-5 px-2 py-8 sm:px-6 sm:py-10">
          {rows.map((row) => (
            <div
              key={row.position}
              className="flex flex-wrap items-start justify-center gap-2 sm:gap-4"
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
