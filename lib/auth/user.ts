import type { User } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/db/client";
import { FplApiError } from "@/lib/fpl/client";
import { createSupabaseServerClient } from "./server";

export type UserProfile = {
  id: string;
  fpl_entry_id: number | null;
  created_at: string;
  updated_at: string;
};

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

function getBootstrapFplEntryId(): number | null {
  const raw = process.env.FPL_BOOTSTRAP_ENTRY_ID ?? process.env.FPL_ENTRY_ID;
  if (!raw) {
    return null;
  }

  const parsed = Number(raw);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export async function getAuthenticatedUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, fpl_entry_id, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new AuthError(`Failed to load profile: ${error.message}`);
  }

  return (data as UserProfile | null) ?? null;
}

export async function ensureUserProfile(user: User): Promise<UserProfile> {
  const existing = await getUserProfile(user.id);
  if (existing?.fpl_entry_id) {
    return existing;
  }

  const bootstrapEntryId = getBootstrapFplEntryId();
  const supabase = getSupabaseAdmin();

  if (!existing) {
    const { data, error } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        fpl_entry_id: bootstrapEntryId,
      })
      .select("id, fpl_entry_id, created_at, updated_at")
      .single();

    if (error) {
      throw new AuthError(`Failed to create profile: ${error.message}`);
    }

    return data as UserProfile;
  }

  if (!existing.fpl_entry_id && bootstrapEntryId) {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        fpl_entry_id: bootstrapEntryId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select("id, fpl_entry_id, created_at, updated_at")
      .single();

    if (error) {
      throw new AuthError(`Failed to update profile: ${error.message}`);
    }

    return data as UserProfile;
  }

  return existing;
}

export async function getAuthenticatedFplEntryId(
  userId?: string,
): Promise<number> {
  const resolvedUserId = userId ?? (await getAuthenticatedUser())?.id;
  if (!resolvedUserId) {
    throw new AuthError("Unauthorized");
  }

  const profile = await ensureUserProfile({
    id: resolvedUserId,
  } as User);

  if (!profile.fpl_entry_id) {
    throw new FplApiError(
      "No FPL entry is linked to this account. Ask an administrator to set profiles.fpl_entry_id.",
    );
  }

  return profile.fpl_entry_id;
}
