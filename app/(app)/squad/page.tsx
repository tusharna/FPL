import { SquadSection } from "@/components/sections/SquadSection";
import { getAuthenticatedDashboardData } from "@/lib/fpl/dashboard-data";

export const dynamic = "force-dynamic";

export default async function SquadPage() {
  const data = await getAuthenticatedDashboardData();
  return <SquadSection data={data} />;
}
