import type { PriceSignal } from "@/lib/intelligence/types";
import { formatPrice } from "@/lib/format";
import { Panel } from "@/components/ui/Panel";
import { Badge } from "@/components/ui/Badge";

type PriceChangesProps = {
  signals: PriceSignal[];
  playerNames?: Map<number, string>;
};

export function PriceChanges({ signals, playerNames }: PriceChangesProps) {
  return (
    <Panel className="p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
        Price
      </p>
      {signals.length === 0 ? (
        <p className="mt-3 text-sm text-white/60">No observed squad price changes.</p>
      ) : (
        <ul className="mt-4 space-y-3 text-sm text-white/80">
          {signals.map((signal) => (
            <li key={signal.playerId} className="flex items-center justify-between gap-3">
              <span>{playerNames?.get(signal.playerId) ?? `Player ${signal.playerId}`}</span>
              <div className="flex items-center gap-2">
                <span>
                  {signal.previousPrice != null
                    ? `${formatPrice(signal.previousPrice)} → ${formatPrice(signal.currentPrice)}`
                    : formatPrice(signal.currentPrice)}
                </span>
                <Badge tone={signal.direction === "RISING" ? "mint" : "gold"}>
                  {signal.direction}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
