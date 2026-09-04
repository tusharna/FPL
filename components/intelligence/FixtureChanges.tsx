import type { FixtureChange } from "@/lib/intelligence/types";
import { Panel } from "@/components/ui/Panel";

type FixtureChangesProps = {
  changes: FixtureChange[];
};

export function FixtureChanges({ changes }: FixtureChangesProps) {
  return (
    <Panel className="p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
        Fixture changes
      </p>
      {changes.length === 0 ? (
        <p className="mt-3 text-sm text-white/60">No fixture changes detected.</p>
      ) : (
        <ul className="mt-4 space-y-3 text-sm text-white/80">
          {changes.slice(0, 8).map((change) => (
            <li key={`${change.fixtureId}-${change.type}`}>
              <p className="font-medium text-white">{change.type.replaceAll("_", " ")}</p>
              <p className="mt-1 text-white/65">
                {change.previousValue ? `${change.previousValue} → ` : ""}
                {change.newValue}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
