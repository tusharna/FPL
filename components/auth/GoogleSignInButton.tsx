"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/auth/client";
import { sanitizeRedirectPath } from "@/lib/auth/redirect";

type GoogleSignInButtonProps = {
  nextPath?: string;
};

export function GoogleSignInButton({ nextPath = "/" }: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const safeNext = sanitizeRedirectPath(nextPath);
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}`;

      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });

      if (signInError) {
        setError("Unable to sign in with Google. Please try again.");
        setLoading(false);
      }
    } catch {
      setError("Unable to sign in with Google. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <button
        type="button"
        onClick={handleSignIn}
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-[0_12px_32px_rgba(0,0,0,0.25)] transition hover:bg-white/95 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-700 ring-1 ring-slate-200">
          G
        </span>
        {loading ? "Signing in..." : "Continue with Google"}
      </button>
      {error ? (
        <p className="text-center text-sm text-rose-300" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
