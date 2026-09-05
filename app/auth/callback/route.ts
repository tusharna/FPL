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

export async function GET(request: Request) {
  if (!isAuthConfigured()) {
    return NextResponse.redirect(
      new URL("/login?error=auth_callback_error", request.url),
    );
  }

  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = sanitizeRedirectPath(requestUrl.searchParams.get("next"));
  const oauthError = requestUrl.searchParams.get("error");

  if (oauthError) {
    const errorCode =
      oauthError === "access_denied" ? "oauth_cancelled" : "auth_callback_error";
    return NextResponse.redirect(
      new URL(`/login?error=${errorCode}&next=${encodeURIComponent(nextPath)}`, request.url),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(`/login?error=auth_callback_error&next=${encodeURIComponent(nextPath)}`, request.url),
    );
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(
      new URL(`/login?error=auth_callback_error&next=${encodeURIComponent(nextPath)}`, request.url),
    );
  }

  try {
    await ensureUserProfile(data.user);
  } catch (profileError) {
    console.error("Failed to ensure user profile:", profileError);
    await supabase.auth.signOut();
    return NextResponse.redirect(
      new URL(`/login?error=auth_callback_error&next=${encodeURIComponent(nextPath)}`, request.url),
    );
  }

  return NextResponse.redirect(new URL(nextPath, request.url));
}
