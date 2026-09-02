import { Bench } from "@/components/Bench";
import { CaptainCard } from "@/components/CaptainCard";
import { Pitch } from "@/components/Pitch";
import { Squad } from "@/components/Squad";
import type { DashboardPayload } from "@/lib/fpl/dashboard-data";

type SquadSectionProps = {
  data: DashboardPayload;
};

export function SquadSection({ data }: SquadSectionProps) {
  return (
    <div className="flex flex-col gap-6">
      <CaptainCard captain={data.captain} viceCaptain={data.viceCaptain} />

      <section className="space-y-3">
        <div className="px-1">
          <h2 className="text-sm font-semibold text-white">Your team</h2>
          <p className="mt-1 text-xs text-white/45">
            Formation is generated from your current FPL picks
          </p>
        </div>
        <Pitch startingXi={data.startingXi} />
      </section>

      <Bench bench={data.bench} />
      <Squad startingXi={data.startingXi} />
    </div>
  );
}
