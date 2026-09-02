import { Badge } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/Panel";
import { formatPoints, formatPrice } from "@/lib/format";
import type { GameweekAnalysis, PlayerAnalysis } from "@/lib/analysis/types";
import type { Position } from "@/lib/fpl/types";

type AnalysisProps = {
  analysis: GameweekAnalysis;
};

const PITCH_ROWS: Position[] = ["GK", "DEF", "MID", "FWD"];

function AnalysisPlayer({ player }: { player: PlayerAnalysis }) {
  return (
    <article className="w-[7.8rem] rounded-2xl border border-cyan-200/20 bg-slate-950/80 px-2 py-2 text-center">
      <p className="truncate text-[11px] font-semibold text-white">{player.webName}</p>
      <p className="text-[9px] uppercase tracking-wider text-cyan-100/70">
        {player.position} · {player.teamShortName}
      </p>
      <p className="mt-1 text-xs tabular-nums text-cyan-200">
        {player.overallScore.toFixed(2)}
      </p>
    </article>
  );
}

export function Analysis({ analysis }: AnalysisProps) {
  const transfer = analysis.transferRecommendation;
  const rows = PITCH_ROWS.map((position) => ({
    position,
    players: analysis.recommendedXI.filter((player) => player.position === position),
  })).filter((row) => row.players.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3 px-1">
        <div>
          <h2 className="text-lg font-semibold text-white">Decision engine</h2>
          <p className="mt-1 text-xs text-white/45">
            Recommendations only — your current picks above are unchanged
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="sky">Formation {analysis.recommendedFormation}</Badge>
          <Badge tone={transfer.action === "SAVE" ? "mint" : "gold"}>
            {transfer.action === "SAVE" ? "SAVE TRANSFER" : "TRANSFER"}
          </Badge>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
            Recommended captain
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">
            ⭐ {analysis.captain.player.webName}
          </p>
          <p className="mt-1 text-sm text-white/55">
            Score {analysis.captain.score.toFixed(2)}
          </p>
          <ul className="mt-3 space-y-1 text-xs text-white/60">
            {analysis.captain.reasons.map((reason) => (
              <li key={reason}>• {reason}</li>
            ))}
          </ul>
        </Panel>
        <Panel className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
            Recommended vice-captain
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {analysis.viceCaptain.player.webName}
          </p>
          <p className="mt-1 text-sm text-white/55">
            Score {analysis.viceCaptain.score.toFixed(2)}
          </p>
          <ul className="mt-3 space-y-1 text-xs text-white/60">
            {analysis.viceCaptain.reasons.map((reason) => (
              <li key={reason}>• {reason}</li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel className="p-5">
        <h3 className="text-sm font-semibold text-white">
          Recommended XI · {analysis.recommendedFormation}
        </h3>
        <p className="mt-1 text-xs text-white/45">
          Highest-scoring legal formation from your 15-player squad
        </p>
        <div className="mt-4 flex flex-col gap-4 rounded-[1.5rem] border border-cyan-300/15 bg-cyan-950/30 px-3 py-6">
          {rows.map((row) => (
            <div key={row.position} className="flex flex-wrap justify-center gap-2">
              {row.players.map((player) => (
                <AnalysisPlayer key={player.playerId} player={player} />
              ))}
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="p-5">
        <h3 className="text-sm font-semibold text-white">Lineup changes</h3>
        {analysis.lineupChanges.length === 0 ? (
          <p className="mt-3 text-sm text-emerald-200">
            No starting XI changes recommended.
          </p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {analysis.lineupChanges.map((change) => (
              <li
                key={`${change.playerOut.playerId}-${change.playerIn.playerId}`}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
              >
                <span className="text-white/70">{change.playerOut.webName}</span>
                <span className="mx-2 text-white/35">→ Bench</span>
                <span className="text-cyan-200">{change.playerIn.webName}</span>
                <span className="mx-2 text-white/35">→ Starting XI</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel className="p-5">
        <h3 className="text-sm font-semibold text-white">Recommended bench order</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {analysis.benchOrder.map((player, index) => (
            <div
              key={player.playerId}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3"
            >
              <p className="text-[10px] uppercase tracking-wider text-white/40">
                Slot {index + 1}
              </p>
              <p className="mt-1 font-medium text-white">{player.webName}</p>
              <p className="text-xs text-white/45">
                {player.position} · xPts {formatPoints(player.expectedPointsNext)}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="p-5">
        <h3 className="text-sm font-semibold text-white">Transfer decision</h3>
        <p className="mt-2 text-xl font-semibold text-white">
          {transfer.action === "SAVE" ? "SAVE TRANSFER" : "TRANSFER"}
        </p>
        {transfer.action === "TRANSFER" && transfer.playerIn && transfer.playerOut ? (
          <p className="mt-2 text-sm text-white/70">
            {transfer.playerOut.webName} → {transfer.playerIn.webName} · gain{" "}
            {transfer.score?.toFixed(2)}
          </p>
        ) : null}
        <ul className="mt-3 space-y-1 text-xs text-white/60">
          {transfer.reasons.map((reason) => (
            <li key={reason}>• {reason}</li>
          ))}
        </ul>
        <h4 className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
          Top transfer candidates
        </h4>
        {analysis.topTransferCandidates.length === 0 ? (
          <p className="mt-2 text-sm text-white/50">No improving legal replacements found.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-white/40">
                <tr>
                  <th className="py-2 pr-4">Out</th>
                  <th className="py-2 pr-4">In</th>
                  <th className="py-2 pr-4">Gain</th>
                  <th className="py-2">Price</th>
                </tr>
              </thead>
              <tbody>
                {analysis.topTransferCandidates.slice(0, 5).map((candidate) => (
                  <tr
                    key={`${candidate.playerOut.playerId}-${candidate.playerIn.playerId}`}
                    className="border-t border-white/8"
                  >
                    <td className="py-2 pr-4 text-white/70">
                      {candidate.playerOut.webName}
                    </td>
                    <td className="py-2 pr-4 text-white">
                      {candidate.playerIn.webName}
                    </td>
                    <td className="py-2 pr-4 tabular-nums text-cyan-200">
                      {candidate.gain.toFixed(2)}
                    </td>
                    <td className="py-2 tabular-nums text-white/60">
                      {formatPrice(candidate.playerIn.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel className="p-5">
          <h3 className="text-sm font-semibold text-white">Player risks</h3>
          <ul className="mt-3 space-y-2">
            {analysis.playerRisks
              .filter((item) => item.risk !== "LOW")
              .concat(
                analysis.playerRisks.filter((item) => item.risk === "LOW").slice(0, 3),
              )
              .slice(0, 8)
              .map((item) => (
                <li
                  key={item.player.playerId}
                  className="rounded-xl border border-white/10 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-white">
                      {item.player.webName}
                    </p>
                    <Badge
                      tone={
                        item.risk === "HIGH"
                          ? "gold"
                          : item.risk === "MEDIUM"
                            ? "sky"
                            : "mint"
                      }
                    >
                      {item.risk}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-white/50">{item.reasons[0]}</p>
                </li>
              ))}
          </ul>
        </Panel>
        <Panel className="p-5">
          <h3 className="text-sm font-semibold text-white">Fixture outlook</h3>
          <p className="mt-1 text-xs text-white/45">
            Short-term (next GW) vs medium-term (5 GWs)
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-white/40">
                <tr>
                  <th className="py-2 pr-3">Player</th>
                  <th className="py-2 pr-3">GW</th>
                  <th className="py-2 pr-3">5 GW</th>
                  <th className="py-2">Outlook</th>
                </tr>
              </thead>
              <tbody>
                {analysis.fixtureOutlook.map((row) => (
                  <tr key={row.playerId} className="border-t border-white/8">
                    <td className="py-2 pr-3 text-white">{row.name}</td>
                    <td className="py-2 pr-3 tabular-nums text-white/70">
                      {row.fixtureScore.toFixed(2)}
                    </td>
                    <td className="py-2 pr-3 tabular-nums text-white/70">
                      {row.fixtureScoreMedium.toFixed(2)}
                    </td>
                    <td className="py-2 text-xs text-cyan-200">{row.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
