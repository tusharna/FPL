import Link from "next/link";
import { Panel } from "@/components/ui/Panel";

type PlanningErrorPanelProps = {
  title: string;
  message: string;
  showAuthHelp?: boolean;
};

export function PlanningErrorPanel({
  title,
  message,
  showAuthHelp = false,
}: PlanningErrorPanelProps) {
  return (
    <Panel className="p-6">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-white/70">{message}</p>
      {showAuthHelp ? (
        <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 text-xs leading-6 text-amber-100/90">
          <p className="font-semibold text-amber-200">FPL authentication required</p>
          <p className="mt-2 font-medium text-amber-100">Quick fix (local dev, ~8 hours):</p>
          <ol className="mt-1 list-decimal space-y-1 pl-4">
            <li>Log in at fantasy.premierleague.com</li>
            <li>DevTools → Network → filter <code className="rounded bg-black/30 px-1">my-team</code></li>
            <li>Copy the <code className="rounded bg-black/30 px-1">x-api-authorization</code> header value</li>
            <li>
              Add to <code className="rounded bg-black/30 px-1">.env.local</code> as{" "}
              <code className="rounded bg-black/30 px-1">FPL_ACCESS_TOKEN=...</code>
            </li>
            <li>Restart <code className="rounded bg-black/30 px-1">npm run dev</code></li>
          </ol>
          <p className="mt-3 font-medium text-amber-100">Long-lived token:</p>
          <p className="mt-1">
            Copy <code className="rounded bg-black/30 px-1">refresh_token</code> from
            DevTools → Application → Local Storage →{" "}
            <code className="rounded bg-black/30 px-1">oidc.user:...</code>, set{" "}
            <code className="rounded bg-black/30 px-1">FPL_REFRESH_TOKEN</code>, then run{" "}
            <code className="rounded bg-black/30 px-1">npm run fpl:auth-test</code>.
          </p>
        </div>
      ) : null}
      <p className="mt-4 text-sm">
        <Link href="/squad" className="text-emerald-300 underline-offset-2 hover:underline">
          ← Back to squad
        </Link>
      </p>
    </Panel>
  );
}
