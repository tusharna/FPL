import { redirect } from "next/navigation";

type LegacyDashboardProps = {
  params: Promise<{ section: string }>;
};

export default async function LegacyDashboardSectionPage({
  params,
}: LegacyDashboardProps) {
  const { section } = await params;
  const allowed = new Set(["squad", "analysis", "report"]);
  redirect(allowed.has(section) ? `/${section}` : "/squad");
}
