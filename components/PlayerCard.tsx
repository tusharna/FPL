import { Fixture } from "@/components/Fixture";
import { formatPoints, formatPrice } from "@/lib/format";
import type { SquadPlayer } from "@/lib/fpl/types";

type PlayerCardProps = {
  player: SquadPlayer;
  compact?: boolean;
  showFixture?: boolean;
};

export function PlayerCard({
  player,
  compact = false,
  showFixture = false,
}: PlayerCardProps) {
  const badge = player.isCaptain ? "C" : player.isViceCaptain ? "VC" : null;

  return (
    <article
      className={`relative rounded-lg border border-white/10 bg-slate-950/80 text-left shadow-none ${
        compact ? "w-[7.5rem] px-2 py-2" : "w-full p-3"
      }`}
    >
      {badge ? (
        <span
          className={`absolute -top-2 -right-2 rounded-full px-1.5 py-0.5 text-[10px] font-bold tracking-wide ${
            player.isCaptain
              ? "bg-amber-400 text-slate-950"
              : "bg-slate-200 text-slate-900"
          }`}
        >
          {badge}
        </span>
      ) : null}

      <p className={`font-semibold leading-tight text-white ${compact ? "text-xs" : "text-sm"}`}>
        {player.webName}
      </p>
      <p className="mt-0.5 text-[10px] uppercase tracking-wider text-white/55">
        {player.position} · {player.teamShortName}
      </p>

      <dl
        className={`mt-2 grid gap-x-2 gap-y-1 text-[11px] text-white/80 ${
          compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"
        }`}
      >
        <div>
          <dt className="text-white/40">Price</dt>
          <dd>{formatPrice(player.price)}</dd>
        </div>
        <div>
          <dt className="text-white/40">Form</dt>
          <dd>{formatPoints(player.form)}</dd>
        </div>
        <div>
          <dt className="text-white/40">GW pts</dt>
          <dd>{player.eventPoints}</dd>
        </div>
        <div>
          <dt className="text-white/40">xPts</dt>
          <dd>{formatPoints(player.expectedPointsNext)}</dd>
        </div>
      </dl>

      {!compact && player.isCaptain ? (
        <p className="mt-2 text-xs font-semibold text-amber-300">Captain</p>
      ) : null}
      {!compact && player.isViceCaptain ? (
        <p className="mt-2 text-xs font-semibold text-slate-200">Vice Captain</p>
      ) : null}

      {showFixture ? (
        <p className="mt-2 text-[11px] text-white/70">
          <Fixture fixture={player.nextFixture} />
        </p>
      ) : null}
    </article>
  );
}
