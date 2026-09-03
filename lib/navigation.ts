export const DASHBOARD_SECTIONS = [
  { href: "/squad", label: "Squad", description: "Live picks & formation" },
  { href: "/analysis", label: "Analysis", description: "Decision engine" },
  { href: "/report", label: "Report", description: "AI gameweek report" },
  { href: "/gameweeks", label: "History", description: "Gameweek snapshots" },
] as const;

export type DashboardSectionHref = (typeof DASHBOARD_SECTIONS)[number]["href"];
