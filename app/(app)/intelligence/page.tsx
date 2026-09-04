import { IntelligencePanel } from "@/components/intelligence/IntelligencePanel";
import { getDashboardData } from "@/lib/fpl/dashboard-data";

export const dynamic = "force-dynamic";

export default async function IntelligencePage() {
  const data = await getDashboardData();
  const playerNames = new Map(data.squad.map((player) => [player.id, player.webName]));
  return (
    <IntelligencePanel intelligence={data.intelligence} playerNames={playerNames} />
  );
}
