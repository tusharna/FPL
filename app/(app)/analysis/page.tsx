import { AnalysisSection } from "@/components/sections/AnalysisSection";
import { getAuthenticatedDashboardData } from "@/lib/fpl/dashboard-data";

export const dynamic = "force-dynamic";

export default async function AnalysisPage() {
  const data = await getAuthenticatedDashboardData();
  return <AnalysisSection data={data} />;
}
