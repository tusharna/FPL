import { formatFixture } from "@/lib/format";
import type { UpcomingFixture } from "@/lib/fpl/types";

type FixtureProps = {
  fixture: UpcomingFixture | null;
};

export function Fixture({ fixture }: FixtureProps) {
  if (!fixture) {
    return <span className="text-white/40">No fixture</span>;
  }

  return (
    <span className="font-medium text-emerald-200">
      {formatFixture(fixture.eventId, fixture.opponentShortName, fixture.isHome)}
    </span>
  );
}
