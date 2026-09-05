const BLOCKED_PREFIXES = ["/login", "/auth"];

export function sanitizeRedirectPath(
  path: string | null | undefined,
  fallback = "/",
): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return fallback;
  }

  for (const prefix of BLOCKED_PREFIXES) {
    if (path === prefix || path.startsWith(`${prefix}/`)) {
      return fallback;
    }
  }

  return path;
}
