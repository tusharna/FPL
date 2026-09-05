import { AlertTriangle } from "lucide-react";
import { Fixture } from "@/components/Fixture";
import { Badge } from "@/components/ui/Badge";
import { formatPoints, formatPrice } from "@/lib/format";
import type { Position, SquadPlayer } from "@/lib/fpl/types";

type PlayerCardProps = {
  player: SquadPlayer;
  compact?: boolean;
  showFixture?: boolean;
};

// Kit Jersey Themes based on position
const KIT_CONFIG: Record<
  Position,
  {
    primary: string;
    secondary: string;
    collar: string;
    number: string;
    border: string;
    glow: string;
  }
> = {
  GK: {
    primary: "#d97706",
    secondary: "#f59e0b",
    collar: "#fbbf24",
    number: "#78350f",
    border: "rgba(251, 191, 36, 0.4)",
    glow: "rgba(245, 158, 11, 0.25)",
  },
  DEF: {
    primary: "#1d4ed8",
    secondary: "#3b82f6",
    collar: "#93c5fd",
    number: "#1e3a8a",
    border: "rgba(96, 165, 250, 0.4)",
    glow: "rgba(59, 130, 246, 0.25)",
  },
  MID: {
    primary: "#047857",
    secondary: "#10b981",
    collar: "#6ee7b7",
    number: "#064e3b",
    border: "rgba(52, 211, 153, 0.4)",
    glow: "rgba(16, 185, 129, 0.25)",
  },
  FWD: {
    primary: "#be123c",
    secondary: "#f43f5e",
    collar: "#fda4af",
    number: "#881337",
    border: "rgba(251, 113, 133, 0.4)",
    glow: "rgba(244, 63, 94, 0.25)",
  },
};

function KitJersey({ position, teamCode }: { position: Position; teamCode: string }) {
  const config = KIT_CONFIG[position];

  return (
    <div className="relative flex items-center justify-center">
      <svg
        viewBox="0 0 70 64"
        className="h-12 w-14 sm:h-14 sm:w-16 drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-105"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`grad-${position}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={config.secondary} />
            <stop offset="50%" stopColor={config.primary} />
            <stop offset="100%" stopColor={config.primary} />
          </linearGradient>
          <linearGradient id={`sleeve-${position}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={config.secondary} />
            <stop offset="100%" stopColor={config.primary} />
          </linearGradient>
        </defs>

        {/* Sleeves */}
        {/* Left sleeve */}
        <path
          d="M 17 14 L 3 24 L 9 32 L 19 23 Z"
          fill={`url(#sleeve-${position})`}
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="1"
        />
        {/* Right sleeve */}
        <path
          d="M 53 14 L 67 24 L 61 32 L 51 23 Z"
          fill={`url(#sleeve-${position})`}
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="1"
        />

        {/* Main Jersey Torso */}
        <path
          d="M 18 14 C 24 18, 46 18, 52 14 L 54 58 C 54 60, 52 61, 50 61 L 20 61 C 18 61, 16 60, 16 58 Z"
          fill={`url(#grad-${position})`}
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1.2"
        />

        {/* Collar */}
        <path
          d="M 27 15 C 27 21, 43 21, 43 15 C 38 18, 32 18, 27 15 Z"
          fill={config.collar}
        />

        {/* Athletic chest stripes / badge */}
        <rect x="23" y="27" width="24" height="2" rx="1" fill="rgba(255,255,255,0.25)" />
        <rect x="26" y="32" width="18" height="1.5" rx="0.75" fill="rgba(255,255,255,0.2)" />

        {/* Team Code on jersey */}
        <text
          x="35"
          y="47"
          textAnchor="middle"
          fill="rgba(255,255,255,0.92)"
          fontSize="9"
          fontWeight="900"
          fontFamily="system-ui, sans-serif"
          letterSpacing="0.06em"
        >
          {teamCode}
        </text>
      </svg>
    </div>
  );
}

function RoleBadge({ player }: { player: SquadPlayer }) {
  if (player.isCaptain) {
    return <Badge tone="gold">⭐ Captain</Badge>;
  }
  if (player.isViceCaptain) {
    return <Badge tone="neutral">Vice</Badge>;
  }
  return null;
}

function Stats({ player, compact }: { player: SquadPlayer; compact: boolean }) {
  if (compact) {
    return (
      <div className="flex items-center justify-between border-t border-white/[0.08] pt-1.5 text-[10px]">
        <div className="flex flex-col items-start">
          <span className="text-[9px] uppercase font-semibold text-white/40">GW pts</span>
          <span className="font-bold tabular-nums text-emerald-300">
            {player.eventPoints * (player.multiplier || 1)}
          </span>
        </div>
        <div className="h-4 w-px bg-white/10" />
        <div className="flex flex-col items-center">
          <span className="text-[9px] uppercase font-semibold text-white/40">xPts</span>
          <span className="font-bold tabular-nums text-cyan-300">
            {formatPoints(player.expectedPointsNext)}
          </span>
        </div>
        <div className="h-4 w-px bg-white/10" />
        <div className="flex flex-col items-end">
          <span className="text-[9px] uppercase font-semibold text-white/40">Price</span>
          <span className="font-medium tabular-nums text-white/70">
            {formatPrice(player.price)}
          </span>
        </div>
      </div>
    );
  }

  const items = [
    ["Price", formatPrice(player.price)],
    ["Form", formatPoints(player.form)],
    ["GW pts", String(player.eventPoints * (player.multiplier || 1))],
    ["xPts", formatPoints(player.expectedPointsNext)],
  ] as const;

  return (
    <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-lg bg-white/[0.04] p-1.5 text-center">
          <dt className="text-[10px] uppercase font-medium tracking-wider text-white/45">{label}</dt>
          <dd className="mt-0.5 font-bold tabular-nums text-white">{value}</dd>
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
  const hasDoubt = player.chanceOfPlaying !== null && player.chanceOfPlaying < 100;

  if (compact) {
    return (
      <article className="group relative flex w-[7.8rem] flex-col items-center sm:w-[8.6rem]">
        {/* Captaincy Foil Badge */}
        {player.isCaptain && (
          <div className="captain-foil absolute -top-2 -right-1 z-20 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black tracking-tight ring-2 ring-[#06090e] shadow-md animate-bounce">
            C
          </div>
        )}
        {player.isViceCaptain && (
          <div className="vice-foil absolute -top-2 -right-1 z-20 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black tracking-tight ring-2 ring-[#06090e] shadow-md">
            V
          </div>
        )}

        {/* Injury / Doubt warning indicator */}
        {hasDoubt && (
          <div
            title={player.news || `Availability: ${player.chanceOfPlaying}%`}
            className="absolute -top-2 -left-1 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/90 text-slate-950 ring-2 ring-[#06090e] shadow-md"
          >
            <AlertTriangle className="h-3 w-3" strokeWidth={2.8} />
          </div>
        )}

        {/* 3D Kit Jersey */}
        <KitJersey position={player.position} teamCode={player.teamShortName} />

        {/* Player Info Card Pill */}
        <div className="-mt-2 w-full rounded-2xl border border-white/[0.12] bg-slate-950/90 p-2 shadow-xl backdrop-blur-xl transition-all duration-300 group-hover:border-white/30 group-hover:bg-slate-950/95 group-hover:shadow-[0_12px_28px_rgba(0,0,0,0.5)]">
          {/* Player Name */}
          <p className="truncate text-center text-xs font-bold text-white tracking-tight">
            {player.webName}
          </p>

          {/* Position & Team Code Pill */}
          <div className="mt-0.5 flex items-center justify-center gap-1.5">
            <span
              className="text-[9px] font-bold uppercase tracking-wider"
              style={{ color: KIT_CONFIG[player.position].secondary }}
            >
              {player.position}
            </span>
            <span className="text-white/20">·</span>
            <span className="text-[9px] font-medium uppercase tracking-wider text-white/50">
              {player.teamShortName}
            </span>
          </div>

          {/* Stats Bar */}
          <div className="mt-1.5">
            <Stats player={player} compact />
          </div>

          {/* Fixture Pill */}
          {showFixture && (
            <div className="mt-2 flex justify-center">
              <Fixture fixture={player.nextFixture} compact />
            </div>
          )}
        </div>
      </article>
    );
  }

  // Expanded card (used on Bench or lists)
  return (
    <article className="group relative flex w-full items-center gap-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3.5 shadow-lg backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06] hover:shadow-xl">
      {/* Jersey Token */}
      <div className="relative shrink-0">
        <KitJersey position={player.position} teamCode={player.teamShortName} />
        {player.isCaptain && (
          <div className="captain-foil absolute -top-1 -right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ring-1 ring-black">
            C
          </div>
        )}
        {player.isViceCaptain && (
          <div className="vice-foil absolute -top-1 -right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ring-1 ring-black">
            V
          </div>
        )}
      </div>

      {/* Details */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <div className="flex items-center gap-2 min-w-0">
            <p className="truncate text-sm font-bold text-white tracking-tight">
              {player.webName}
            </p>
            <span
              className="text-[10px] font-bold uppercase"
              style={{ color: KIT_CONFIG[player.position].secondary }}
            >
              {player.position}
            </span>
          </div>
          <RoleBadge player={player} />
        </div>

        {hasDoubt && (
          <p className="mt-0.5 flex items-center gap-1 text-[10px] font-medium text-amber-300/90 truncate">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            <span>{player.news || `Doubtful: ${player.chanceOfPlaying}% chance`}</span>
          </p>
        )}

        <div className="mt-2">
          <Stats player={player} compact={false} />
        </div>

        {showFixture && (
          <div className="mt-2.5 flex items-center justify-between">
            <span className="text-[10px] uppercase font-semibold text-white/40">Next Match</span>
            <Fixture fixture={player.nextFixture} />
          </div>
        )}
      </div>
    </article>
  );
}

