import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const TOKEN_FILE = join(process.cwd(), ".fpl-refresh-token");

/** Loads the persisted refresh token (survives PingOne rotation in local dev). */
export function loadStoredRefreshToken(): string | null {
  if (!existsSync(TOKEN_FILE)) {
    return null;
  }

  try {
    const value = readFileSync(TOKEN_FILE, "utf8").trim();
    return value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

/** Persists the latest refresh token after PingOne rotation. */
export function saveStoredRefreshToken(token: string): void {
  if (process.env.NODE_ENV === "test") {
    return;
  }

  try {
    writeFileSync(TOKEN_FILE, `${token.trim()}\n`, "utf8");
  } catch (error) {
    console.warn(
      "[fpl/token-store] Could not persist rotated refresh token:",
      error instanceof Error ? error.message : error,
    );
  }
}
