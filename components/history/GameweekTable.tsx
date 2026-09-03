import Link from "next/link";
import type { GameweekHistorySummary } from "@/lib/history/types";
import { Badge } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/Panel";

type GameweekTableProps = {
  rows: GameweekHistorySummary[];
};

function formatDelta(value: number | null | undefined): string {
  if (value == null) {
    return "—";
  }
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(0)}`;
}

export function GameweekTable({ rows }: GameweekTableProps) {
  if (rows.length === 0) {
    return (
      <Panel className="p-6">
        <p className="text-sm text-white/70">
          No gameweek history yet. Generate a report to store the first snapshot.
        </p>
      </Panel>
    );
  }

  return (
    <Panel className="overflow-x-auto p-0">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-white/10 text-[11px] uppercase tracking-[0.18em] text-white/45">
          <tr>
            <th className="px-4 py-3">GW</th>
            <th className="px-4 py-3">Actual</th>
            <th className="px-4 py-3">Recommended</th>
            <th className="px-4 py-3">Delta</th>
            <th className="px-4 py-3">Captain</th>
            <th className="px-4 py-3">Transfer</th>
            <th className="px-4 py-3">Report</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const evaluation = row.evaluation;
            return (
              <tr
                key={row.gameweek.id}
                className="border-b border-white/5 text-white/80 last:border-b-0"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/gameweeks/${row.gameweek.id}`}
                    className="font-semibold text-emerald-300 hover:text-emerald-200"
                  >
                    GW{row.gameweek.id}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {evaluation ? evaluation.actualTeamPoints : "—"}
                </td>
                <td className="px-4 py-3">
                  {evaluation ? evaluation.recommendedTeamPoints : "—"}
                </td>
                <td className="px-4 py-3">
                  {formatDelta(evaluation?.lineupDelta)}
                </td>
                <td className="px-4 py-3">
                  {evaluation ? (
                    <Badge tone={evaluation.captainCorrect ? "mint" : "gold"}>
                      {evaluation.captainCorrect ? "Match" : "Miss"}
                    </Badge>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">
                  {row.recommendation?.transfer_action ?? "—"}
                </td>
                <td className="px-4 py-3">
                  {row.hasReport ? (
                    <Badge tone="sky">Saved</Badge>
                  ) : (
                    <Badge tone="neutral">None</Badge>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Panel>
  );
}
