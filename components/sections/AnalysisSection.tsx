import { Analysis } from "@/components/Analysis";
import type { DashboardPayload } from "@/lib/fpl/dashboard-data";

type AnalysisSectionProps = {
  data: DashboardPayload;
};

export function AnalysisSection({ data }: AnalysisSectionProps) {
  return <Analysis analysis={data.analysis} />;
}
