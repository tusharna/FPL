import { Panel } from "@/components/ui/Panel";
import type { AIReport } from "@/lib/ai/types";

export function ExecutiveSummary({ report }: { report: AIReport }) {
  return (
    <Panel className="p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
        Executive summary
      </p>
      <h3 className="mt-2 text-xl font-semibold text-white">{report.title}</h3>
      <p className="mt-3 text-sm leading-6 text-white/75">{report.executiveSummary}</p>
    </Panel>
  );
}
