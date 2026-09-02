import { Badge } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/Panel";
import type { AIReport } from "@/lib/ai/types";

export function CaptainCard({ report }: { report: AIReport }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Panel className="p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
          Captain
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h3 className="text-xl font-semibold text-white">⭐ {report.captain.player}</h3>
          <Badge tone="gold">{report.captain.confidence} confidence</Badge>
        </div>
        <p className="mt-3 text-sm leading-6 text-white/75">{report.captain.explanation}</p>
      </Panel>
      <Panel className="p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
          Vice-captain
        </p>
        <h3 className="mt-2 text-xl font-semibold text-white">{report.viceCaptain.player}</h3>
        <p className="mt-3 text-sm leading-6 text-white/75">
          {report.viceCaptain.explanation}
        </p>
      </Panel>
    </div>
  );
}
