"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Link2 } from "lucide-react";
import { Panel } from "@/components/ui/Panel";

type LinkedTeam = {
  entryId: number | null;
  teamName: string | null;
  managerName: string | null;
};

type TeamSettingsProps = {
  redirectOnSave?: boolean;
};

export function TeamSettings({ redirectOnSave = false }: TeamSettingsProps) {
  const router = useRouter();
  const [team, setTeam] = useState<LinkedTeam | null>(null);
  const [entryId, setEntryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function loadTeam() {
      try {
        const response = await fetch("/api/profile");
        const data = (await response.json()) as LinkedTeam & { error?: string };
        if (!response.ok) {
          throw new Error(data.error ?? "Failed to load your linked team");
        }
        setTeam(data);
        if (data.entryId) {
          setEntryId(String(data.entryId));
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load your linked team",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadTeam();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId }),
      });
      const data = (await response.json()) as LinkedTeam & { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to link this team");
      }
      setTeam(data);
      setSaved(true);
      router.refresh();
      if (redirectOnSave) {
        router.push("/squad");
      }
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to link this team",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel className="p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30">
          <Link2 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">FPL team</h2>
          <p className="mt-0.5 text-xs text-white/50">
            Link the team this account should load. The ID is the number in your
            fantasy.premierleague.com team URL.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-white/60">Loading linked team…</p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {team?.entryId ? (
            <p className="text-sm text-white/70">
              Currently linked
              {team.teamName ? ` to ${team.teamName}` : ` to team ${team.entryId}`}
              {team.managerName ? ` · ${team.managerName}` : ""}.
            </p>
          ) : (
            <p className="text-sm text-white/70">
              No team is linked yet. Squad, analysis, and history stay unavailable until you save one.
            </p>
          )}

          <label className="block text-sm text-white/80">
            FPL team ID
            <input
              value={entryId}
              onChange={(event) => setEntryId(event.target.value)}
              inputMode="numeric"
              placeholder="3944035"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none ring-emerald-400/40 placeholder:text-white/30 focus:ring-2"
            />
          </label>

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          {saved ? (
            <p className="text-sm text-emerald-300">Team linked. Dashboard data will refresh.</p>
          ) : null}

          <button
            type="submit"
            disabled={saving || entryId.trim().length === 0}
            className="rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save team"}
          </button>
        </form>
      )}
    </Panel>
  );
}
