import type { DataFreshness } from "@/lib/intelligence/types";
import { formatFreshnessAge } from "@/lib/intelligence/freshness";
import { Badge } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/Panel";

type DataFreshnessProps = {
  items: DataFreshness[];
};

export function DataFreshnessPanel({ items }: DataFreshnessProps) {
  return (
    <Panel className="p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
        Data freshness
      </p>
      <ul className="mt-4 space-y-2 text-sm text-white/75">
        {items.map((item) => (
          <li key={item.source} className="flex flex-wrap items-center justify-between gap-2">
            <span>{item.source}</span>
            <div className="flex items-center gap-2">
              <span className="text-white/50">
                Updated {formatFreshnessAge(item.fetchedAt)}
              </span>
              <Badge
                tone={
                  item.status === "FRESH"
                    ? "mint"
                    : item.status === "STALE"
                      ? "gold"
                      : "neutral"
                }
              >
                {item.status}
              </Badge>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
