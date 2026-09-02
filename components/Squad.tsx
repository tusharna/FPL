import { Fixture } from "@/components/Fixture";
import { Badge } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/Panel";
import { formatPoints, formatPrice } from "@/lib/format";
import type { SquadPlayer } from "@/lib/fpl/types";

type SquadProps = {
  startingXi: SquadPlayer[];
};

function Role({ player }: { player: SquadPlayer }) {
  if (player.isCaptain) {
    return <Badge tone="gold">⭐ Captain</Badge>;
  }
  if (player.isViceCaptain) {
    return <Badge>Vice</Badge>;
  }
  return <span className="text-white/25">—</span>;
}

export function Squad({ startingXi }: SquadProps) {
  return (
    <Panel>
      <div className="border-b border-white/10 px-5 py-4">
        <h2 className="text-sm font-semibold tracking-tight text-white">Starting XI</h2>
        <p className="mt-1 text-xs text-white/45">
          Selected by multiplier &gt; 0 from live FPL picks
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-[11px] uppercase tracking-wider text-white/40">
            <tr>
              <th className="px-5 py-3 font-medium">Player</th>
              <th className="px-5 py-3 font-medium">Position</th>
              <th className="px-5 py-3 font-medium">Price</th>
              <th className="px-5 py-3 font-medium">Form</th>
              <th className="px-5 py-3 font-medium">GW Points</th>
              <th className="px-5 py-3 font-medium">Expected Points</th>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium">Next fixture</th>
            </tr>
          </thead>
          <tbody>
            {startingXi.map((player) => (
              <tr
                key={player.id}
                className="border-t border-white/6 transition hover:bg-white/[0.03]"
              >
                <td className="px-5 py-3.5">
                  <div className="font-medium text-white">{player.webName}</div>
                  <div className="text-xs text-white/40">{player.teamShortName}</div>
                </td>
                <td className="px-5 py-3.5">
                  <Badge tone="mint">{player.position}</Badge>
                </td>
                <td className="px-5 py-3.5 tabular-nums text-white/75">
                  {formatPrice(player.price)}
                </td>
                <td className="px-5 py-3.5 tabular-nums text-white/75">
                  {formatPoints(player.form)}
                </td>
                <td className="px-5 py-3.5 tabular-nums font-medium text-white">
                  {player.eventPoints}
                </td>
                <td className="px-5 py-3.5 tabular-nums text-white/75">
                  {formatPoints(player.expectedPointsNext)}
                </td>
                <td className="px-5 py-3.5">
                  <Role player={player} />
                </td>
                <td className="px-5 py-3.5">
                  <Fixture fixture={player.nextFixture} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
