"use client";

import type { NotificationEventRow } from "@/lib/notifications/types";

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

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) {
    const minutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : `${days} days ago`;
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
            {formatRelativeTime(notification.created_at)}
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
