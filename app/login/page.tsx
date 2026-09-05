import type { Metadata } from "next";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { sanitizeRedirectPath } from "@/lib/auth/redirect";

export const metadata: Metadata = {
  title: "Sign in — FPL Assistant",
  description: "Sign in with Google to access your FPL Assistant dashboard.",
};

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
    error?: string;
  }>;
};

const ERROR_MESSAGES: Record<string, string> = {
  auth_callback_error: "Unable to sign in with Google. Please try again.",
  oauth_cancelled: "Google sign-in was cancelled. Please try again.",
  session_expired: "Your session expired. Please sign in again.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = sanitizeRedirectPath(params.next);
  const errorMessage = params.error
    ? (ERROR_MESSAGES[params.error] ?? ERROR_MESSAGES.auth_callback_error)
    : null;

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
          {errorMessage ? (
            <p
              className="mb-4 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-center text-sm text-rose-200"
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}
          <GoogleSignInButton nextPath={nextPath} />
        </div>

        <p className="mt-6 text-center text-xs text-white/45">
          Sign in to access your dashboard.
        </p>
      </div>
    </div>
  );
}
