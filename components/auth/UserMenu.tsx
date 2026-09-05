"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/auth/client";

type UserMenuProps = {
  email: string | null;
  displayName?: string | null;
};

export function UserMenu({ email, displayName }: UserMenuProps) {
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);

    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch {
      setSigningOut(false);
    }
  }

  const label = displayName?.trim() || email?.split("@")[0] || "Account";

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/80">
      <div className="min-w-0 text-right">
        <p className="truncate font-semibold text-white">{label}</p>
        <p className="truncate text-xs text-white/55">Google Account</p>
        {email ? (
          <p className="truncate text-[11px] text-white/45">Signed in as {email}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <LogOut className="h-3.5 w-3.5" />
        {signingOut ? "Signing out..." : "Sign out"}
      </button>
    </div>
  );
}
