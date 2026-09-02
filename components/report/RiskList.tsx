import { Badge } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/Panel";
import type { AIReport } from "@/lib/ai/types";

export function RiskList({ report }: { report: AIReport }) {
  return (
    <Panel className="p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
        Risks
      </p>
      {report.risks.length === 0 ? (
        <p className="mt-3 text-sm text-white/55">No material risks in the supplied analysis.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {report.risks.map((item) => (
            <li
              key={`${item.player}-${item.risk}`}
              className="rounded-xl border border-white/10 px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-white">{item.player}</p>
                <Badge
                  tone={
                    item.risk === "HIGH" ? "gold" : item.risk === "MEDIUM" ? "sky" : "mint"
                  }
                >
                  {item.risk}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-white/55">{item.explanation}</p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
