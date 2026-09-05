import { AlertTriangle, TableProperties } from "lucide-react";
import { Fixture } from "@/components/Fixture";
import { Badge } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/Panel";
import { formatPoints, formatPrice } from "@/lib/format";
import type { Position, SquadPlayer } from "@/lib/fpl/types";

type SquadProps = {
  startingXi: SquadPlayer[];
};

const POSITION_TONES: Record<Position, "gold" | "sky" | "mint" | "rose"> = {
  GK: "gold",
  DEF: "sky",
  MID: "mint",
  FWD: "rose",
};

function Role({ player }: { player: SquadPlayer }) {
  if (player.isCaptain) {
    return <Badge tone="gold">⭐ Captain</Badge>;
  }
  if (player.isViceCaptain) {
    return <Badge tone="neutral">Vice</Badge>;
  }
  return <span className="text-white/20">—</span>;
}

export function Squad({ startingXi }: SquadProps) {
  const totalValue = startingXi.reduce((sum, p) => sum + p.price, 0);
  const totalGwPoints = startingXi.reduce(
    (sum, p) => sum + p.eventPoints * (p.multiplier || 1),
    0
  );
  const totalXpts = startingXi
    .reduce((sum, p) => sum + (p.expectedPointsNext || 0) * (p.multiplier || 1), 0)
    .toFixed(1);

  return (
    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30">
            <TableProperties className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white uppercase tracking-wider">
              Starting XI Roster
            </h2>
            <p className="text-[11px] text-white/50">
              Detailed statistics and next matchup analysis for starters
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full bg-white/[0.05] px-3 py-1 font-semibold text-white/70 ring-1 ring-white/10">
            11 Starters
          </span>
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 font-bold text-emerald-300 ring-1 ring-emerald-500/20">
            {formatPrice(totalValue)} Total
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-white/[0.06] bg-white/[0.02] text-[10px] uppercase font-bold tracking-wider text-white/45">
            <tr>
              <th className="px-6 py-3.5">Player</th>
              <th className="px-4 py-3.5">Pos</th>
              <th className="px-4 py-3.5">Price</th>
              <th className="px-4 py-3.5">Form</th>
              <th className="px-4 py-3.5">GW Pts</th>
              <th className="px-4 py-3.5">xPts</th>
              <th className="px-4 py-3.5">Role</th>
              <th className="px-6 py-3.5">Next Fixture</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {startingXi.map((player) => {
              const hasDoubt = player.chanceOfPlaying !== null && player.chanceOfPlaying < 100;

              return (
                <tr
                  key={player.id}
                  className="transition-colors duration-150 hover:bg-white/[0.04]"
                >
                  {/* Player Name & Team */}
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white tracking-tight">
                            {player.webName}
                          </span>
                          {hasDoubt && (
                            <span
                              title={player.news || `${player.chanceOfPlaying}% chance`}
                              className="text-amber-400"
                            >
                              <AlertTriangle className="h-3 w-3" />
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-medium text-white/40">
                          {player.teamShortName} · {player.name}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Position Badge */}
                  <td className="px-4 py-3.5">
                    <Badge tone={POSITION_TONES[player.position]}>
                      {player.position}
                    </Badge>
                  </td>

                  {/* Price */}
                  <td className="px-4 py-3.5 tabular-nums font-medium text-white/80">
                    {formatPrice(player.price)}
                  </td>

                  {/* Form */}
                  <td className="px-4 py-3.5 tabular-nums font-semibold text-emerald-300">
                    {formatPoints(player.form)}
                  </td>

                  {/* GW Points */}
                  <td className="px-4 py-3.5 tabular-nums font-bold text-white">
                    {player.eventPoints * (player.multiplier || 1)}
                    {player.multiplier > 1 && (
                      <span className="ml-1 text-[10px] font-semibold text-amber-300">
                        (x{player.multiplier})
                      </span>
                    )}
                  </td>

                  {/* Expected Points */}
                  <td className="px-4 py-3.5 tabular-nums font-semibold text-cyan-300">
                    {formatPoints(player.expectedPointsNext)}
                  </td>

                  {/* Captaincy Role */}
                  <td className="px-4 py-3.5">
                    <Role player={player} />
                  </td>

                  {/* Fixture */}
                  <td className="px-6 py-3.5">
                    <Fixture fixture={player.nextFixture} />
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t border-white/[0.08] bg-white/[0.02] text-xs font-semibold text-white/70">
            <tr>
              <td className="px-6 py-3.5 text-white uppercase tracking-wider font-bold text-[11px]">
                XI Totals
              </td>
              <td className="px-4 py-3.5" />
              <td className="px-4 py-3.5 tabular-nums text-white font-bold">
                {formatPrice(totalValue)}
              </td>
              <td className="px-4 py-3.5" />
              <td className="px-4 py-3.5 tabular-nums text-emerald-300 font-bold">
                {totalGwPoints} pts
              </td>
              <td className="px-4 py-3.5 tabular-nums text-cyan-300 font-bold">
                {totalXpts} xPts
              </td>
              <td colSpan={2} className="px-6 py-3.5" />
            </tr>
          </tfoot>
        </table>
      </div>
    </Panel>
  );
}

