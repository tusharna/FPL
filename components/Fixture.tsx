import type { UpcomingFixture } from "@/lib/fpl/types";

type FixtureProps = {
  fixture: UpcomingFixture | null;
  compact?: boolean;
};

export function Fixture({ fixture, compact = false }: FixtureProps) {
  if (!fixture) {
    return <span className="text-[10px] text-white/30 italic">No fixture</span>;
  }

  const isHome = fixture.isHome;

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-tight ${
          isHome
            ? "bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/25"
            : "bg-sky-400/10 text-sky-300 ring-1 ring-sky-400/25"
        }`}
      >
        <span className="font-bold">{fixture.opponentShortName}</span>
        <span className="text-[9px] opacity-75">{isHome ? "(H)" : "(A)"}</span>
      </span>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide ring-1 transition-all ${
        isHome
          ? "bg-emerald-500/10 text-emerald-300 ring-emerald-500/25 hover:bg-emerald-500/15"
          : "bg-sky-500/10 text-sky-300 ring-sky-500/25 hover:bg-sky-500/15"
      }`}
    >
      <span className="text-[9px] font-bold text-white/50 uppercase">GW{fixture.eventId}</span>
      <span className="h-2 w-px bg-white/15" />
      <span className="font-bold text-white">{fixture.opponentShortName}</span>
      <span
        className={`rounded px-1 text-[9px] font-bold ${
          isHome ? "bg-emerald-400/20 text-emerald-200" : "bg-sky-400/20 text-sky-200"
        }`}
      >
        {isHome ? "H" : "A"}
      </span>
    </div>
  );
}

