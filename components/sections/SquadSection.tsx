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
      {/* 1. Captaincy Command Showcase */}
      <CaptainCard captain={data.captain} viceCaptain={data.viceCaptain} />

      {/* 2. Tactical Stadium Pitch Lineup */}
      <Pitch startingXi={data.startingXi} />

      {/* 3. Dugout & Reserves Bench */}
      <Bench bench={data.bench} />

      {/* 4. Complete Starting XI Table with Totals */}
      <Squad startingXi={data.startingXi} />
    </div>
  );
}

