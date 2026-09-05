const FPL_BASE_URL = "https://fantasy.premierleague.com/api";
const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 3;

export class FplApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "FplApiError";
    this.status = status;
  }
}

type FetchOptions = {
  revalidateSeconds?: number;
  timeoutMs?: number;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(status: number): boolean {
  return status === 429 || status >= 500;
}

export async function fplGet<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const url = path.startsWith("http") ? path : `${FPL_BASE_URL}${path}`;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  let lastError: Error = new FplApiError("Unable to load FPL data.");

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "User-Agent": "fpl-report/0.1 (Phase 1 dashboard)",
        },
        next: {
          revalidate: options.revalidateSeconds ?? 300,
        },
      });

      if (!response.ok) {
        lastError = new FplApiError(
          `FPL API request failed (${response.status})`,
          response.status,
        );
        if (isRetryable(response.status) && attempt < MAX_RETRIES) {
          await sleep(250 * 2 ** (attempt - 1));
          continue;
        }
        throw lastError;
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof FplApiError) {
        lastError = error;
        if (error.status && isRetryable(error.status) && attempt < MAX_RETRIES) {
          await sleep(250 * 2 ** (attempt - 1));
          continue;
        }
        throw error;
      }

      lastError =
        error instanceof Error
          ? error.name === "AbortError"
            ? new FplApiError("FPL API request timed out.")
            : error
          : new FplApiError("Unable to load FPL data.");

      if (attempt < MAX_RETRIES) {
        await sleep(250 * 2 ** (attempt - 1));
        continue;
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError;
}

/** Background jobs (cron) only — user-facing code must use getAuthenticatedFplEntryId(). */
export function getEntryId(): number {
  const raw = process.env.FPL_ENTRY_ID ?? process.env.FPL_BOOTSTRAP_ENTRY_ID;
  const parsed = Number(raw);

  if (!raw || Number.isNaN(parsed) || parsed <= 0) {
    throw new FplApiError(
      "FPL_ENTRY_ID is missing or invalid. Set it in .env.local for cron jobs.",
    );
  }

  return parsed;
}
