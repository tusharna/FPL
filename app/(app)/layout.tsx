import type { ReactNode } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { getAuthenticatedUser } from "@/lib/auth/user";
import { getAuthenticatedDashboardData } from "@/lib/fpl/dashboard-data";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [data, user] = await Promise.all([
    getAuthenticatedDashboardData(),
    getAuthenticatedUser(),
  ]);

  return (
    <DashboardShell
      data={data}
      userEmail={user?.email ?? null}
      userDisplayName={
        typeof user?.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name
          : null
      }
    >
      {children}
    </DashboardShell>
  );
}
