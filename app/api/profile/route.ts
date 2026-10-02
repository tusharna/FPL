import { requireApiUser } from "@/lib/auth/api";
import { parseFplEntryId } from "@/lib/auth/entry-id";
import { getUserProfile, setUserFplEntryId } from "@/lib/auth/user";
import { FplApiError } from "@/lib/fpl/client";
import { getEntry } from "@/lib/fpl/entry";

export const dynamic = "force-dynamic";

function teamPayload(entry: {
  id: number;
  name: string;
  player_first_name: string;
  player_last_name: string;
}) {
  return {
    entryId: entry.id,
    teamName: entry.name,
    managerName: `${entry.player_first_name} ${entry.player_last_name}`.trim(),
  };
}

export async function GET() {
  const user = await requireApiUser();
  if (user instanceof Response) {
    return user;
  }

  const profile = await getUserProfile(user.id);
  if (!profile?.fpl_entry_id) {
    return Response.json({ entryId: null, teamName: null, managerName: null });
  }

  try {
    const entry = await getEntry(profile.fpl_entry_id);
    return Response.json(teamPayload(entry));
  } catch {
    return Response.json({
      entryId: profile.fpl_entry_id,
      teamName: null,
      managerName: null,
    });
  }
}

export async function PUT(request: Request) {
  const user = await requireApiUser();
  if (user instanceof Response) {
    return user;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const entryId = parseFplEntryId(
    body && typeof body === "object" && "entryId" in body
      ? (body as { entryId: unknown }).entryId
      : null,
  );
  if (!entryId) {
    return Response.json(
      { error: "Enter a valid FPL team ID from your team page URL." },
      { status: 400 },
    );
  }

  try {
    const entry = await getEntry(entryId);
    await setUserFplEntryId(user.id, entryId);
    return Response.json(teamPayload(entry));
  } catch (error) {
    if (error instanceof FplApiError && error.status === 404) {
      return Response.json(
        { error: "FPL could not find a team with that ID." },
        { status: 404 },
      );
    }

    console.error("Failed to link FPL team:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to link this FPL team.",
      },
      { status: 500 },
    );
  }
}
