import type { NotificationType } from "./types";

export function buildDedupeKey(
  gameweek: number,
  type: NotificationType,
  parts: (string | number)[] = [],
): string {
  const suffix = parts.length > 0 ? `:${parts.join(":")}` : "";
  return `GW${gameweek}:${type}${suffix}`;
}

export function isDuplicate(
  dedupeKey: string,
  existingKeys: Set<string>,
): boolean {
  return existingKeys.has(dedupeKey);
}
