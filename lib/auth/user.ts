import type { User } from "@supabase/supabase-js";
import { getSupabaseAdmin, isDatabaseConfigured } from "@/lib/db/client";
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

const PROFILE_COLUMNS = "id, fpl_entry_id, created_at, updated_at";

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

async function readProfileWithSession(
  userId: string,
): Promise<UserProfile | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new AuthError(`Failed to load profile: ${error.message}`);
  }

  return (data as UserProfile | null) ?? null;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    return await readProfileWithSession(userId);
  } catch {
    if (!isDatabaseConfigured()) {
      throw new AuthError("Database is not configured.");
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      throw new AuthError(`Failed to load profile: ${error.message}`);
    }

    return (data as UserProfile | null) ?? null;
  }
}

async function createProfileWithSession(
  userId: string,
  bootstrapEntryId: number | null,
): Promise<UserProfile | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      fpl_entry_id: bootstrapEntryId,
    })
    .select(PROFILE_COLUMNS)
    .single();

  if (error) {
    return null;
  }

  return data as UserProfile;
}

async function createProfileWithAdmin(
  userId: string,
  bootstrapEntryId: number | null,
): Promise<UserProfile> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      fpl_entry_id: bootstrapEntryId,
    })
    .select(PROFILE_COLUMNS)
    .single();

  if (error) {
    throw new AuthError(`Failed to create profile: ${error.message}`);
  }

  return data as UserProfile;
}

async function updateProfileFplEntryWithSession(
  userId: string,
  bootstrapEntryId: number,
): Promise<UserProfile> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      fpl_entry_id: bootstrapEntryId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select(PROFILE_COLUMNS)
    .single();

  if (error) {
    throw new AuthError(`Failed to update profile: ${error.message}`);
  }

  return data as UserProfile;
}

export async function ensureUserProfile(user: User): Promise<UserProfile> {
  let existing = await readProfileWithSession(user.id);
  if (existing?.fpl_entry_id) {
    return existing;
  }

  const bootstrapEntryId = getBootstrapFplEntryId();

  if (!existing) {
    const created =
      (await createProfileWithSession(user.id, bootstrapEntryId)) ??
      (await createProfileWithAdmin(user.id, bootstrapEntryId).catch(() => null));

    if (created) {
      existing = created;
      if (existing.fpl_entry_id || !bootstrapEntryId) {
        return existing;
      }
    } else {
      throw new AuthError(
        "Profile not found after sign-in. Run supabase/migrations/004_auth_profiles.sql in Supabase.",
      );
    }
  }

  if (!existing.fpl_entry_id && bootstrapEntryId) {
    return updateProfileFplEntryWithSession(user.id, bootstrapEntryId);
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
