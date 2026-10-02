import type { ReactNode } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { LinkTeamPrompt } from "@/components/settings/LinkTeamPrompt";
import { MissingFplEntryError, getAuthenticatedUser } from "@/lib/auth/user";
import { getAuthenticatedDashboardData } from "@/lib/fpl/dashboard-data";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getAuthenticatedUser();

  let data;
  try {
    data = await getAuthenticatedDashboardData();
  } catch (error) {
    if (error instanceof MissingFplEntryError) {
      return <LinkTeamPrompt email={user?.email ?? null} />;
    }
    throw error;
  }

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
