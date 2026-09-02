import { Fixture } from "@/components/Fixture";
import { Badge } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/Panel";
import { formatPoints, formatPrice } from "@/lib/format";
import type { Position, SquadPlayer } from "@/lib/fpl/types";

type CaptainCardProps = {
  captain: SquadPlayer | null;
  viceCaptain: SquadPlayer | null;
};

const SHIRT: Record<Position, string> = {
  GK: "from-amber-200 via-yellow-400 to-amber-600",
  DEF: "from-sky-300 via-blue-500 to-blue-800",
  MID: "from-emerald-200 via-emerald-500 to-teal-800",
  FWD: "from-rose-300 via-red-500 to-red-800",
};

function RoleTile({
  title,
  player,
  featured,
}: {
  title: string;
  player: SquadPlayer | null;
  featured?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        featured
          ? "border-amber-300/30 bg-linear-to-br from-amber-300/16 to-transparent"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">
        {title}
      </p>
      {player ? (
        <div className="mt-4 flex items-start gap-4">
          <div
            className={`player-shirt h-16 w-12 shrink-0 bg-linear-to-b ${SHIRT[player.position]}`}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xl font-semibold tracking-tight text-white">
                {featured ? `⭐ ${player.webName}` : player.webName}
              </p>
              <Badge tone={featured ? "gold" : "neutral"}>
                {player.position} · {player.teamShortName}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-white/70">
              {formatPrice(player.price)} · Form {formatPoints(player.form)} ·{" "}
              {player.eventPoints} GW pts
            </p>
            <div className="mt-3">
              <Fixture fixture={player.nextFixture} />
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-lg text-white/50">Not set</p>
      )}
    </div>
  );
}

export function CaptainCard({ captain, viceCaptain }: CaptainCardProps) {
  return (
    <Panel className="grid gap-3 p-3 sm:grid-cols-2 sm:p-4">
      <RoleTile title="Captain" player={captain} featured />
      <RoleTile title="Vice Captain" player={viceCaptain} />
    </Panel>
  );
}
