/**
 * Server-side FPL API authentication (PingOne OIDC).
 *
 * Required for authenticated endpoints such as `/api/my-team/{entry_id}/`.
 * Credentials are never exposed to the browser.
 *
 * Set `FPL_REFRESH_TOKEN` in server environment (.env.local / Vercel).
 * Obtain the token by logging in at fantasy.premierleague.com and copying
 * the refresh_token from the browser's oidc.user localStorage entry.
 */

import { loadStoredRefreshToken, saveStoredRefreshToken } from "./token-store";

const OIDC_TOKEN_URL = "https://account.premierleague.com/as/token";
const OIDC_CLIENT_ID = "bfcbaf69-aade-4c1b-8f00-c1cb8a193030";

export class FplAuthNotConfiguredError extends Error {
  constructor() {
    super(
      "FPL API authentication is not configured. Set FPL_REFRESH_TOKEN in server environment.",
    );
    this.name = "FplAuthNotConfiguredError";
  }
}

export class FplAuthError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "FplAuthError";
    this.status = status;
  }
}

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

let cachedAccessToken: string | null = null;
let cachedAccessTokenExpiresAt = 0;
let cachedRefreshToken: string | null = null;

/**
 * Parses a refresh token from a bare token or full oidc.user JSON blob.
 */
export function parseFplRefreshToken(value: string): string {
  const trimmed = value.trim();
  try {
    const parsed = JSON.parse(trimmed) as { refresh_token?: string };
    if (typeof parsed.refresh_token === "string" && parsed.refresh_token.length > 0) {
      return parsed.refresh_token;
    }
  } catch {
    // Not JSON — treat as bare token.
  }
  if (trimmed.length === 0) {
    throw new FplAuthNotConfiguredError();
  }
  return trimmed;
}

export function isFplAuthConfigured(): boolean {
  return Boolean(getDirectAccessToken() || process.env.FPL_REFRESH_TOKEN?.trim());
}

/** Optional short-lived bearer token copied from browser Network tab (dev only). */
function getDirectAccessToken(): string | null {
  const raw = process.env.FPL_ACCESS_TOKEN?.trim();
  if (!raw) {
    return null;
  }
  return raw.startsWith("Bearer ") ? raw.slice("Bearer ".length) : raw;
}

function getRefreshToken(): string {
  if (cachedRefreshToken) {
    return cachedRefreshToken;
  }

  const stored = loadStoredRefreshToken();
  if (stored) {
    cachedRefreshToken = parseFplRefreshToken(stored);
    return cachedRefreshToken;
  }

  const raw = process.env.FPL_REFRESH_TOKEN?.trim();
  if (!raw) {
    throw new FplAuthNotConfiguredError();
  }

  cachedRefreshToken = parseFplRefreshToken(raw);
  return cachedRefreshToken;
}

async function exchangeRefreshToken(refreshToken: string): Promise<string> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: OIDC_CLIENT_ID,
  });

  const response = await fetch(OIDC_TOKEN_URL, {
    method: "POST",
    headers: {
      "User-Agent": "fpl-report/0.1 (server)",
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
  });

  const payload = (await response.json()) as TokenResponse;

  if (!response.ok || !payload.access_token) {
    throw new FplAuthError(
      `FPL token refresh failed: ${payload.error ?? response.status} ${payload.error_description ?? ""}`.trim(),
      response.status,
    );
  }

  cachedAccessToken = payload.access_token;
  cachedAccessTokenExpiresAt =
    Date.now() + (payload.expires_in ?? 300) * 1000 - 15_000;

  if (payload.refresh_token && payload.refresh_token !== refreshToken) {
    cachedRefreshToken = payload.refresh_token;
    saveStoredRefreshToken(payload.refresh_token);
  }

  return cachedAccessToken;
}

/** Returns a short-lived bearer token for authenticated FPL API calls. */
export async function getFplAccessToken(): Promise<string> {
  const direct = getDirectAccessToken();
  if (direct) {
    return direct;
  }

  if (cachedAccessToken && Date.now() < cachedAccessTokenExpiresAt) {
    return cachedAccessToken;
  }

  return exchangeRefreshToken(getRefreshToken());
}

/** Clears in-memory token cache (for tests and 401 retry). */
export function clearFplAuthCache(): void {
  cachedAccessToken = null;
  cachedAccessTokenExpiresAt = 0;
  cachedRefreshToken = null;
}
