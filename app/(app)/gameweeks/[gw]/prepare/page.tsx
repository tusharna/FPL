import { redirect } from "next/navigation";
import { PlanningErrorPanel } from "@/components/planning/PlanningErrorPanel";
import { PrepareGameweekView } from "@/components/planning/PrepareGameweekView";
import { getBootstrapStatic } from "@/lib/fpl/bootstrap";
import {
  getPlanningGameweek,
  isValidPlanningTarget,
} from "@/lib/fpl/gameweek-state";
import { getAuthenticatedNextGameweekPlanningData } from "@/lib/fpl/planning-data";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ gw: string }>;
};

export default async function PrepareGameweekPage({ params }: PageProps) {
  const { gw } = await params;
  const gameweekId = Number.parseInt(gw, 10);
  if (!Number.isFinite(gameweekId) || gameweekId <= 0) {
    redirect("/gameweeks");
  }

  const bootstrap = await getBootstrapStatic();
  const event = bootstrap.events.find((item) => item.id === gameweekId);

  if (!event) {
    redirect("/gameweeks");
  }

  if (event.finished) {
    redirect(`/gameweeks/${gameweekId}`);
  }

  const planningContext = getPlanningGameweek(bootstrap.events);
  if (!planningContext) {
    return (
      <PlanningErrorPanel
        title="No planning gameweek"
        message="There is no upcoming gameweek available for planning right now."
      />
    );
  }

  if (!isValidPlanningTarget(bootstrap.events, gameweekId)) {
    redirect(`/gameweeks/${planningContext.planningGameweek.id}/prepare`);
  }

  const result = await getAuthenticatedNextGameweekPlanningData(gameweekId);

  if (!result.ok) {
    if (
      result.error === "AUTH_NOT_CONFIGURED" ||
      result.error === "AUTH_EXPIRED"
    ) {
      return (
        <PlanningErrorPanel
          title={
            result.error === "AUTH_EXPIRED"
              ? "FPL token expired"
              : "FPL authentication required"
          }
          message={result.message}
          showAuthHelp
        />
      );
    }

    if (result.error === "MY_TEAM_UNAVAILABLE") {
      return (
        <PlanningErrorPanel
          title="Unable to load your current FPL squad"
          message={`${result.message} Please try again.`}
        />
      );
    }

    return (
      <PlanningErrorPanel title="Planning unavailable" message={result.message} />
    );
  }

  return <PrepareGameweekView data={result.data} />;
}
