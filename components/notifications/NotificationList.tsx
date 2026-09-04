"use client";

import { useEffect, useState } from "react";
import { NotificationCard } from "./NotificationCard";
import { Panel } from "@/components/ui/Panel";
import type { NotificationEventRow } from "@/lib/notifications/types";

export function NotificationList() {
  const [notifications, setNotifications] = useState<NotificationEventRow[]>([]);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadNotifications() {
      setError(null);
      try {
        const response = await fetch("/api/notifications");
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "Failed to load notifications");
        }
        setNotifications(data.notifications ?? []);
        setConfigured(data.configured ?? true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load notifications");
      } finally {
        setLoading(false);
      }
    }

    void loadNotifications();
  }, []);

  const markRead = async (id: number) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? { ...notification, read_at: new Date().toISOString() }
          : notification,
      ),
    );
  };

  return (
    <Panel className="p-6 sm:p-8">
      <header className="mb-6">
        <h2 className="text-2xl font-semibold text-white">Notifications</h2>
        <p className="mt-2 text-sm text-white/55">
          Alerts when meaningful changes affect your FPL decisions.
        </p>
      </header>

      {loading && <p className="text-sm text-white/50">Loading notifications…</p>}
      {error && <p className="text-sm text-rose-300">{error}</p>}
      {!configured && (
        <p className="text-sm text-amber-200/90">
          Database not configured. Notification history requires Supabase.
        </p>
      )}

      {!loading && notifications.length === 0 && (
        <p className="text-sm text-white/50">No notifications yet.</p>
      )}

      <div className="flex flex-col gap-4">
        {notifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onMarkRead={markRead}
          />
        ))}
      </div>
    </Panel>
  );
}
