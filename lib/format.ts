export const APP_TIMEZONE = "Asia/Kolkata";

const IST_LOCALE = "en-IN";

function parseIso(iso: string | null): Date | null {
  if (!iso) {
    return null;
  }

  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatInTimezone(
  iso: string | null,
  options: Intl.DateTimeFormatOptions,
): string {
  const date = parseIso(iso);
  if (!date) {
    return "TBC";
  }

  return new Intl.DateTimeFormat(IST_LOCALE, {
    ...options,
    timeZone: APP_TIMEZONE,
  }).format(date);
}

export function formatPrice(value: number): string {
  return `£${value.toFixed(1)}m`;
}

export function formatPoints(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function formatRank(value: number | null): string {
  if (value == null) {
    return "—";
  }
  return value.toLocaleString("en-IN");
}

/** Gameweek deadline in IST. */
export function formatDeadline(iso: string | null): string {
  return formatInTimezone(iso, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
    hour12: true,
  });
}

/** Full date and time in IST. */
export function formatDateTime(iso: string | null): string {
  return formatInTimezone(iso, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
    hour12: true,
  });
}

/** Date only in IST. */
export function formatDate(iso: string | null): string {
  return formatInTimezone(iso, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - Date.parse(iso);
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

/** Relative time with IST timestamp for UI labels. */
export function formatTimestamp(iso: string): string {
  const diffMs = Date.now() - Date.parse(iso);
  if (diffMs < 24 * 60 * 60 * 1000) {
    return `${formatRelativeTime(iso)} · ${formatDateTime(iso)}`;
  }

  return formatDateTime(iso);
}

/** @deprecated Use formatDeadline — all app timestamps are IST. */
export function formatDeadlineIST(iso: string | null): string {
  return formatDeadline(iso);
}

export function formatFixture(eventId: number, opponent: string, isHome: boolean): string {
  return `GW${eventId}: ${opponent} (${isHome ? "H" : "A"})`;
}
