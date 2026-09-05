import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isAuthConfigured,
} from "./config";
import { sanitizeRedirectPath } from "./redirect";

const PUBLIC_PATHS = new Set(["/login"]);
const PUBLIC_PREFIXES = ["/auth/"];
const CRON_PREFIX = "/api/cron/";

export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) {
    return true;
  }

  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function isCronPath(pathname: string): boolean {
  return pathname.startsWith(CRON_PREFIX);
}

export function isProtectedApiPath(pathname: string): boolean {
  return pathname.startsWith("/api/") && !isCronPath(pathname);
}

export function shouldForwardAuthCode(
  pathname: string,
  searchParams: URLSearchParams,
): boolean {
  return (
    pathname !== "/auth/callback" && Boolean(searchParams.get("code"))
  );
}

export function buildAuthCallbackUrl(request: NextRequest): URL {
  const callbackUrl = new URL("/auth/callback", request.url);
  const { searchParams } = request.nextUrl;

  for (const key of ["code", "next", "error", "error_description"]) {
    const value = searchParams.get(key);
    if (value) {
      callbackUrl.searchParams.set(key, value);
    }
  }

  if (!callbackUrl.searchParams.get("next")) {
    callbackUrl.searchParams.set(
      "next",
      sanitizeRedirectPath(searchParams.get("next")),
    );
  }

  return callbackUrl;
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });
  const { pathname } = request.nextUrl;

  if (shouldForwardAuthCode(pathname, request.nextUrl.searchParams)) {
    return NextResponse.redirect(buildAuthCallbackUrl(request));
  }

  if (!isAuthConfigured()) {
    if (!isPublicPath(pathname) && !isCronPath(pathname)) {
      if (isProtectedApiPath(pathname)) {
        return NextResponse.json(
          { error: "Authentication is not configured." },
          { status: 503 },
        );
      }

      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("error", "auth_callback_error");
      return NextResponse.redirect(loginUrl);
    }

    return response;
  }

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isCronPath(pathname) || isPublicPath(pathname)) {
    if (user && pathname === "/login") {
      const next = sanitizeRedirectPath(
        request.nextUrl.searchParams.get("next"),
      );
      return NextResponse.redirect(new URL(next, request.url));
    }

    return response;
  }

  if (!user) {
    if (isProtectedApiPath(pathname)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
