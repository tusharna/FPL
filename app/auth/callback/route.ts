import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ensureUserProfile } from "@/lib/auth/user";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isAuthConfigured,
} from "@/lib/auth/config";
import { sanitizeRedirectPath } from "@/lib/auth/redirect";

export const dynamic = "force-dynamic";

function loginRedirect(request: Request, error: string, nextPath: string): NextResponse {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("error", error);
  loginUrl.searchParams.set("next", nextPath);
  return NextResponse.redirect(loginUrl);
}

export async function GET(request: Request) {
  if (!isAuthConfigured()) {
    return loginRedirect(request, "auth_not_configured", "/");
  }

  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = sanitizeRedirectPath(requestUrl.searchParams.get("next"));
  const oauthError = requestUrl.searchParams.get("error");

  if (oauthError) {
    const errorCode =
      oauthError === "access_denied" ? "oauth_cancelled" : "auth_callback_error";
    return loginRedirect(request, errorCode, nextPath);
  }

  if (!code) {
    return loginRedirect(request, "missing_auth_code", nextPath);
  }

  const cookieStore = await cookies();
  let response = NextResponse.redirect(new URL(nextPath, request.url));

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
        response = NextResponse.redirect(new URL(nextPath, request.url));
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    console.error("exchangeCodeForSession failed:", error?.message);
    return loginRedirect(request, "session_exchange_failed", nextPath);
  }

  try {
    await ensureUserProfile(data.user);
  } catch (profileError) {
    console.error("Failed to ensure user profile:", profileError);
    await supabase.auth.signOut();
    return loginRedirect(request, "profile_setup_failed", nextPath);
  }

  return response;
}
