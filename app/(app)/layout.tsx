import { DashboardShell } from "@/components/DashboardShell";
import { getDashboardData } from "@/lib/fpl/dashboard-data";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: LayoutProps<"/">) {
  const data = await getDashboardData();
  return <DashboardShell data={data}>{children}</DashboardShell>;
}
