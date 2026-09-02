import { Badge } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/Panel";
import type { AIReport } from "@/lib/ai/types";

export function TransferCard({ report }: { report: AIReport }) {
  return (
    <Panel className="p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
          Transfer
        </p>
        <Badge tone={report.transfer.action === "SAVE" ? "mint" : "gold"}>
          {report.transfer.action === "SAVE" ? "SAVE TRANSFER" : "TRANSFER"}
        </Badge>
      </div>
      <p className="mt-3 text-sm leading-6 text-white/75">{report.transfer.explanation}</p>
    </Panel>
  );
}
