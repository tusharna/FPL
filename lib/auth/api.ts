import type { User } from "@supabase/supabase-js";
import { isAuthConfigured } from "./config";
import {
  AuthError,
  getAuthenticatedFplEntryId,
  getAuthenticatedUser,
} from "./user";

export type AuthenticatedRequestContext = {
  user: User;
  entryId: number;
};

export function unauthorizedResponse(message = "Unauthorized"): Response {
  return Response.json({ error: message }, { status: 401 });
}

export function forbiddenResponse(message = "Forbidden"): Response {
  return Response.json({ error: message }, { status: 403 });
}

export async function requireApiAuth(): Promise<
  AuthenticatedRequestContext | Response
> {
  if (!isAuthConfigured()) {
    return Response.json(
      { error: "Authentication is not configured." },
      { status: 503 },
    );
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    return unauthorizedResponse();
  }

  try {
    const entryId = await getAuthenticatedFplEntryId(user.id);
    return { user, entryId };
  } catch (error) {
    if (error instanceof AuthError) {
      return unauthorizedResponse();
    }

    return forbiddenResponse(
      error instanceof Error ? error.message : "FPL entry not configured.",
    );
  }
}
