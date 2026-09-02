import { AnalysisSection } from "@/components/sections/AnalysisSection";
import { getDashboardData } from "@/lib/fpl/dashboard-data";

export const dynamic = "force-dynamic";

export default async function AnalysisPage() {
  const data = await getDashboardData();
  return <AnalysisSection data={data} />;
}
