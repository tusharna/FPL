import type { AvailabilitySignal } from "@/lib/intelligence/types";
import { Panel } from "@/components/ui/Panel";
import { Badge } from "@/components/ui/Badge";

type AvailabilityAlertsProps = {
  signals: AvailabilitySignal[];
  playerNames?: Map<number, string>;
};

export function AvailabilityAlerts({ signals, playerNames }: AvailabilityAlertsProps) {
  return (
    <Panel className="p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
        Availability
      </p>
      {signals.length === 0 ? (
        <p className="mt-3 text-sm text-white/60">No material availability alerts in the squad.</p>
      ) : (
        <ul className="mt-4 space-y-3 text-sm text-white/80">
          {signals.map((signal) => (
            <li key={signal.playerId} className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-white">
                  {playerNames?.get(signal.playerId) ?? `Player ${signal.playerId}`}
                </p>
                <p className="mt-1 text-white/65">{signal.reason}</p>
              </div>
              <Badge tone={signal.risk === "HIGH" ? "gold" : signal.risk === "MEDIUM" ? "sky" : "neutral"}>
                {signal.risk}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
