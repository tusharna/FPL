import type { IntelligenceAlert, NewsItem } from "@/lib/intelligence/types";
import { sanitizeNewsText } from "@/lib/intelligence/news/provider";
import { Panel } from "@/components/ui/Panel";
import { Badge } from "@/components/ui/Badge";

type NewsAlertsProps = {
  news: NewsItem[];
  alerts: IntelligenceAlert[];
};

export function NewsAlerts({ news, alerts }: NewsAlertsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel className="p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
          Relevant news
        </p>
        {news.length === 0 ? (
          <p className="mt-3 text-sm text-white/60">No relevant news items for the squad.</p>
        ) : (
          <ul className="mt-4 space-y-3 text-sm text-white/80">
            {news.slice(0, 6).map((item) => (
              <li key={item.id}>
                <div className="flex items-center gap-2">
                  <Badge tone={item.relevance === "HIGH" ? "gold" : "sky"}>
                    {item.relevance}
                  </Badge>
                  <span className="text-white/45">{item.source}</span>
                </div>
                <p className="mt-1 text-white">{sanitizeNewsText(item.title)}</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel className="p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
          Decision impact
        </p>
        {alerts.length === 0 ? (
          <p className="mt-3 text-sm text-white/60">No meaningful decision impact detected.</p>
        ) : (
          <ul className="mt-4 space-y-3 text-sm text-white/80">
            {alerts.map((alert) => (
              <li key={`${alert.playerId}-${alert.type}`}>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{alert.player}</span>
                  <Badge tone={alert.severity === "HIGH" ? "gold" : alert.severity === "MEDIUM" ? "sky" : "neutral"}>
                    {alert.severity}
                  </Badge>
                </div>
                <p className="mt-1 text-white/65">{alert.explanation}</p>
                <p className="mt-1 text-xs text-white/45">{alert.type}</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
