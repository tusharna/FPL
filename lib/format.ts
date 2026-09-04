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
  return value.toLocaleString("en-GB");
}

export function formatDeadline(iso: string | null): string {
  if (!iso) {
    return "TBC";
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "TBC";
  }

  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
    timeZoneName: "short",
  }).format(date);
}

/** Deadline formatted for notification emails (India Standard Time). */
export function formatDeadlineIST(iso: string | null): string {
  if (!iso) {
    return "TBC";
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "TBC";
  }

  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
    timeZoneName: "short",
    hour12: true,
  }).format(date);
}

export function formatFixture(eventId: number, opponent: string, isHome: boolean): string {
  return `GW${eventId}: ${opponent} (${isHome ? "H" : "A"})`;
}
