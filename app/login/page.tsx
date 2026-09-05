import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { isAuthConfigured } from "@/lib/auth/config";
import { sanitizeRedirectPath } from "@/lib/auth/redirect";

export const metadata: Metadata = {
  title: "Sign in — FPL Assistant",
  description: "Sign in with Google to access your FPL Assistant dashboard.",
};

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
    error?: string;
    code?: string;
  }>;
};

const ERROR_MESSAGES: Record<string, string> = {
  auth_not_configured:
    "Authentication is not configured. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
  auth_callback_error: "Google sign-in failed. Please try again.",
  oauth_cancelled: "Google sign-in was cancelled. Please try again.",
  session_expired: "Your session expired. Please sign in again.",
  session_exchange_failed:
    "Could not complete sign-in after Google. Restart the dev server, then try again.",
  missing_auth_code:
    "Sign-in callback was missing an authorization code. Please try again.",
  profile_setup_failed:
    "Signed in with Google, but your profile could not be created. Run migration 004_auth_profiles.sql in Supabase.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  if (params.code) {
    const next = sanitizeRedirectPath(params.next);
    redirect(
      `/auth/callback?code=${encodeURIComponent(params.code)}&next=${encodeURIComponent(next)}`,
    );
  }

  const nextPath = sanitizeRedirectPath(params.next);
  const errorMessage = params.error
    ? (ERROR_MESSAGES[params.error] ?? ERROR_MESSAGES.auth_callback_error)
    : null;

  const authConfigured = isAuthConfigured();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-lg flex-col items-center justify-center px-4 py-12">
      <div className="w-full rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-[0_24px_64px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-10">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-3xl ring-1 ring-emerald-400/30">
            ⚽
          </div>
          <h1 className="mt-6 text-3xl font-black tracking-tight text-white">
            FPL Assistant
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-6 text-white/65">
            Your personal FPL decision assistant.
          </p>
        </div>

        <div className="mt-8">
          {!authConfigured ? (
            <p
              className="mb-4 rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-100"
              role="alert"
            >
              Supabase auth is not configured. Add NEXT_PUBLIC_SUPABASE_URL and
              NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart npm run dev.
            </p>
          ) : null}
          {errorMessage ? (
            <p
              className="mb-4 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-center text-sm text-rose-200"
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}
          {authConfigured ? (
            <GoogleSignInButton
              supabaseUrl={supabaseUrl}
              supabaseAnonKey={supabaseAnonKey}
              nextPath={nextPath}
            />
          ) : null}
        </div>

        <p className="mt-6 text-center text-xs text-white/45">
          Sign in to access your dashboard.
        </p>
      </div>
    </div>
  );
}
