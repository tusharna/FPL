const MAX_FPL_ENTRY_ID = 99_999_999;

export function parseFplEntryId(value: unknown): number | null {
  const raw =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.trim())
        : Number.NaN;

  if (!Number.isInteger(raw) || raw <= 0 || raw > MAX_FPL_ENTRY_ID) {
    return null;
  }

  return raw;
}
