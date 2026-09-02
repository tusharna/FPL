import { SquadSection } from "@/components/sections/SquadSection";
import { getDashboardData } from "@/lib/fpl/dashboard-data";

export const dynamic = "force-dynamic";

export default async function SquadPage() {
  const data = await getDashboardData();
  return <SquadSection data={data} />;
}
