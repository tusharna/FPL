import { getFplAccessToken, FplAuthError, clearFplAuthCache } from "./auth";
import { FplApiError } from "./client";

const FPL_BASE_URL = "https://fantasy.premierleague.com/api";
const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;

type AuthenticatedFetchOptions = {
  timeoutMs?: number;
  revalidateSeconds?: number;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Server-side authenticated GET for FPL endpoints (e.g. /my-team/).
 * Never call from Client Components.
 */
export async function fplAuthenticatedGet<T>(
  path: string,
  options: AuthenticatedFetchOptions = {},
): Promise<T> {
  const url = path.startsWith("http") ? path : `${FPL_BASE_URL}${path}`;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  let lastError: Error = new FplApiError("Unable to load authenticated FPL data.");

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const accessToken = await getFplAccessToken();
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "User-Agent": "fpl-report/0.1 (authenticated)",
          "X-API-Authorization": `Bearer ${accessToken}`,
        },
        next: {
          revalidate: options.revalidateSeconds ?? 0,
        },
      });

      if (response.status === 401 || response.status === 403) {
        clearFplAuthCache();
        if (attempt < MAX_RETRIES) {
          await sleep(200);
          continue;
        }
        throw new FplAuthError(
          "FPL authentication failed. Check FPL_REFRESH_TOKEN configuration.",
          response.status,
        );
      }

      if (!response.ok) {
        lastError = new FplApiError(
          `FPL authenticated request failed (${response.status})`,
          response.status,
        );
        throw lastError;
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof FplAuthError || error instanceof FplApiError) {
        throw error;
      }

      lastError =
        error instanceof Error
          ? error.name === "AbortError"
            ? new FplApiError("FPL authenticated request timed out.")
            : error
          : new FplApiError("Unable to load authenticated FPL data.");

      if (attempt < MAX_RETRIES) {
        await sleep(200);
        continue;
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError;
}
