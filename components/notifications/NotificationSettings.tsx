"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/lib/notifications/preferences";
import type { NotificationPreferences } from "@/lib/notifications/types";

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 py-3">
      <span className="text-sm text-white/80">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full transition ${
          checked ? "bg-emerald-400" : "bg-white/15"
        }`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition ${
            checked ? "left-5" : "left-0.5"
          }`}
        />
      </button>
    </label>
  );
}

export function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/api/notifications/preferences");
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "Failed to load preferences");
        }
        if (data.preferences) {
          setPreferences(data.preferences);
        }
        setConfigured(data.configured ?? true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load preferences");
      } finally {
        setLoading(false);
      }
    }

    void loadSettings();
  }, []);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const response = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save preferences");
      }
      setPreferences(data.preferences);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const update = (patch: Partial<NotificationPreferences>) => {
    setPreferences((current) => ({ ...current, ...patch }));
    setSaved(false);
  };

  if (loading) {
    return <p className="text-sm text-white/50">Loading settings…</p>;
  }

  return (
    <Panel className="p-6 sm:p-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Notification Settings</h2>
          <p className="mt-2 text-sm text-white/55">
            Control which alerts you receive and how they are delivered.
          </p>
        </div>
        <Link
          href="/notifications"
          className="text-sm text-emerald-300 hover:text-emerald-200"
        >
          View notifications
        </Link>
      </header>

      {!configured && (
        <p className="mb-4 text-sm text-amber-200/90">
          Database not configured. Settings will not persist without Supabase.
        </p>
      )}

      {error && <p className="mb-4 text-sm text-rose-300">{error}</p>}

      <section className="divide-y divide-white/10 rounded-2xl border border-white/10 px-4">
        <ToggleRow
          label="Email notifications"
          checked={preferences.email}
          onChange={(value) => update({ email: value })}
        />
        <ToggleRow
          label="SMS notifications"
          checked={preferences.sms}
          onChange={(value) => update({ sms: value })}
        />
        <ToggleRow
          label="Gameweek reports"
          checked={preferences.gameweekReports}
          onChange={(value) => update({ gameweekReports: value })}
        />
        <ToggleRow
          label="Deadline reminders"
          checked={preferences.deadlineReminders}
          onChange={(value) => update({ deadlineReminders: value })}
        />
        <ToggleRow
          label="Captain alerts"
          checked={preferences.captainAlerts}
          onChange={(value) => update({ captainAlerts: value })}
        />
        <ToggleRow
          label="Lineup alerts"
          checked={preferences.lineupAlerts}
          onChange={(value) => update({ lineupAlerts: value })}
        />
        <ToggleRow
          label="Transfer alerts"
          checked={preferences.transferAlerts}
          onChange={(value) => update({ transferAlerts: value })}
        />
        <ToggleRow
          label="Availability alerts"
          checked={preferences.availabilityAlerts}
          onChange={(value) => update({ availabilityAlerts: value })}
        />
        <ToggleRow
          label="Fixture alerts"
          checked={preferences.fixtureAlerts}
          onChange={(value) => update({ fixtureAlerts: value })}
        />
        <ToggleRow
          label="Price alerts"
          checked={preferences.priceAlerts}
          onChange={(value) => update({ priceAlerts: value })}
        />
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm text-white/70">Minimum severity</span>
          <select
            value={preferences.minimumSeverity}
            onChange={(event) =>
              update({
                minimumSeverity: event.target.value as NotificationPreferences["minimumSeverity"],
              })
            }
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
          >
            <option value="INFO">INFO</option>
            <option value="IMPORTANT">IMPORTANT</option>
            <option value="URGENT">URGENT</option>
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm text-white/70">Email destination</span>
          <input
            type="email"
            value={preferences.emailDestination ?? ""}
            onChange={(event) =>
              update({ emailDestination: event.target.value || undefined })
            }
            placeholder="you@example.com"
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
          />
        </label>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 px-4">
        <ToggleRow
          label="Quiet hours"
          checked={preferences.quietHours?.enabled ?? false}
          onChange={(value) =>
            update({
              quietHours: {
                enabled: value,
                start: preferences.quietHours?.start ?? "22:00",
                end: preferences.quietHours?.end ?? "07:00",
              },
            })
          }
        />
        {preferences.quietHours?.enabled && (
          <div className="grid gap-4 pb-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-sm text-white/70">Start</span>
              <input
                type="time"
                value={preferences.quietHours.start}
                onChange={(event) =>
                  update({
                    quietHours: {
                      ...preferences.quietHours!,
                      start: event.target.value,
                    },
                  })
                }
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm text-white/70">End</span>
              <input
                type="time"
                value={preferences.quietHours.end}
                onChange={(event) =>
                  update({
                    quietHours: {
                      ...preferences.quietHours!,
                      end: event.target.value,
                    },
                  })
                }
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
              />
            </label>
          </div>
        )}
      </section>

      <div className="mt-6 flex items-center gap-4">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save settings"}
        </button>
        {saved && <span className="text-sm text-emerald-300">Saved</span>}
      </div>
    </Panel>
  );
}
