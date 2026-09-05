"use client";

import type { NotificationEventRow } from "@/lib/notifications/types";
import { formatTimestamp } from "@/lib/format";

type NotificationCardProps = {
  notification: NotificationEventRow;
  onMarkRead?: (id: number) => void;
};

function severityIcon(severity: string): string {
  switch (severity) {
    case "URGENT":
      return "🚨";
    case "IMPORTANT":
      return "⚠️";
    default:
      return "ℹ️";
  }
}

export function NotificationCard({ notification, onMarkRead }: NotificationCardProps) {
  const isUnread = !notification.read_at;

  return (
    <article
      className={`rounded-2xl border p-5 transition ${
        isUnread
          ? "border-emerald-300/25 bg-emerald-400/5"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-white/45">
            {severityIcon(notification.severity)} {notification.type.replace(/_/g, " ")}
          </p>
          <h3 className="mt-1 text-base font-semibold text-white">{notification.title}</h3>
          <p className="mt-2 whitespace-pre-line text-sm text-white/65">
            {notification.message}
          </p>
          <p className="mt-3 text-xs text-white/40">
            {formatTimestamp(notification.created_at)}
          </p>
        </div>
        {isUnread && onMarkRead && (
          <button
            type="button"
            onClick={() => onMarkRead(notification.id)}
            className="shrink-0 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10"
          >
            Mark read
          </button>
        )}
      </div>
    </article>
  );
}
