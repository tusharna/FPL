import { Fixture } from "@/components/Fixture";
import { formatPoints, formatPrice } from "@/lib/format";
import type { SquadPlayer } from "@/lib/fpl/types";

type SquadProps = {
  startingXi: SquadPlayer[];
};

export function Squad({ startingXi }: SquadProps) {
  return (
    <section className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/70">
      <div className="border-b border-white/10 px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
          Starting XI
        </h2>
      </div>
      <table className="min-w-full text-left text-sm">
        <thead className="text-[11px] uppercase tracking-wider text-white/40">
          <tr>
            <th className="px-4 py-2 font-medium">Player</th>
            <th className="px-4 py-2 font-medium">Position</th>
            <th className="px-4 py-2 font-medium">Price</th>
            <th className="px-4 py-2 font-medium">Form</th>
            <th className="px-4 py-2 font-medium">GW Points</th>
            <th className="px-4 py-2 font-medium">Expected Points</th>
            <th className="px-4 py-2 font-medium">Role</th>
            <th className="px-4 py-2 font-medium">Next fixture</th>
          </tr>
        </thead>
        <tbody>
          {startingXi.map((player) => (
            <tr key={player.id} className="border-t border-white/5">
              <td className="px-4 py-2.5 font-medium text-white">
                {player.webName}
                <span className="ml-2 text-xs font-normal text-white/40">
                  {player.teamShortName}
                </span>
              </td>
              <td className="px-4 py-2.5 text-white/70">{player.position}</td>
              <td className="px-4 py-2.5 text-white/70">{formatPrice(player.price)}</td>
              <td className="px-4 py-2.5 text-white/70">{formatPoints(player.form)}</td>
              <td className="px-4 py-2.5 text-white/70">{player.eventPoints}</td>
              <td className="px-4 py-2.5 text-white/70">
                {formatPoints(player.expectedPointsNext)}
              </td>
              <td className="px-4 py-2.5">
                {player.isCaptain ? (
                  <span className="text-amber-300">Captain</span>
                ) : player.isViceCaptain ? (
                  <span className="text-slate-200">Vice</span>
                ) : (
                  <span className="text-white/30">—</span>
                )}
              </td>
              <td className="px-4 py-2.5">
                <Fixture fixture={player.nextFixture} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
