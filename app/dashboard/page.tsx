import { Dashboard } from "@/components/Dashboard";
import { getDashboardData } from "@/lib/fpl/dashboard-data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();
  return <Dashboard data={data} />;
}
