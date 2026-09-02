import { Fixture } from "@/components/Fixture";
import { Badge } from "@/components/ui/Badge";
import { formatPoints, formatPrice } from "@/lib/format";
import type { Position, SquadPlayer } from "@/lib/fpl/types";

type PlayerCardProps = {
  player: SquadPlayer;
  compact?: boolean;
  showFixture?: boolean;
};

const SHIRT: Record<Position, string> = {
  GK: "from-amber-200 via-yellow-400 to-amber-600",
  DEF: "from-sky-300 via-blue-500 to-blue-800",
  MID: "from-emerald-200 via-emerald-500 to-teal-800",
  FWD: "from-rose-300 via-red-500 to-red-800",
};

function RoleBadge({ player }: { player: SquadPlayer }) {
  if (player.isCaptain) {
    return <Badge tone="gold">⭐ Captain</Badge>;
  }
  if (player.isViceCaptain) {
    return <Badge>Vice</Badge>;
  }
  return null;
}

function Stats({ player, compact }: { player: SquadPlayer; compact: boolean }) {
  const items = [
    ["Price", formatPrice(player.price)],
    ["Form", formatPoints(player.form)],
    ["GW pts", String(player.eventPoints)],
    ["xPts", formatPoints(player.expectedPointsNext)],
  ] as const;

  return (
    <dl
      className={`grid gap-x-2 gap-y-1 text-[11px] text-white/85 ${
        compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"
      }`}
    >
      {items.map(([label, value]) => (
        <div key={label}>
          <dt className="text-[10px] uppercase tracking-wider text-white/40">{label}</dt>
          <dd className="font-medium tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function PlayerCard({
  player,
  compact = false,
  showFixture = false,
}: PlayerCardProps) {
  if (compact) {
    return (
      <article className="flex w-[7.6rem] flex-col items-center sm:w-[8.4rem]">
        <div className="relative">
          {player.isCaptain || player.isViceCaptain ? (
            <span
              className={`absolute -right-1 -top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black shadow-lg ${
                player.isCaptain
                  ? "bg-amber-300 text-slate-950"
                  : "bg-white text-slate-900"
              }`}
            >
              {player.isCaptain ? "C" : "V"}
            </span>
          ) : null}
          <div
            className={`player-shirt h-[4.6rem] w-[3.6rem] bg-linear-to-b shadow-[0_10px_20px_rgba(0,0,0,0.35)] ${SHIRT[player.position]}`}
          />
        </div>
        <div className="-mt-2 w-full rounded-2xl border border-white/15 bg-slate-950/85 px-2 py-2 shadow-lg backdrop-blur-md">
          <p className="truncate text-center text-[11px] font-semibold text-white">
            {player.webName}
          </p>
          <p className="mt-0.5 text-center text-[9px] uppercase tracking-wider text-white/50">
            {player.position} · {player.teamShortName}
          </p>
          <div className="mt-1.5">
            <Stats player={player} compact />
          </div>
          {showFixture ? (
            <p className="mt-1.5 flex justify-center">
              <Fixture fixture={player.nextFixture} />
            </p>
          ) : null}
        </div>
      </article>
    );
  }

  return (
    <article className="flex w-full gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <div
        className={`player-shirt mt-1 h-14 w-11 shrink-0 bg-linear-to-b ${SHIRT[player.position]}`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-white">{player.webName}</p>
          <RoleBadge player={player} />
        </div>
        <p className="mt-0.5 text-[11px] uppercase tracking-wider text-white/50">
          {player.position} · {player.teamShortName}
        </p>
        <div className="mt-2">
          <Stats player={player} compact={false} />
        </div>
        {showFixture ? (
          <div className="mt-2">
            <Fixture fixture={player.nextFixture} />
          </div>
        ) : null}
      </div>
    </article>
  );
}
