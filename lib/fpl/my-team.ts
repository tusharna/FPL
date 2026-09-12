import { z } from "zod";
import { fplAuthenticatedGet } from "./authenticated-client";
import { FplAuthError, FplAuthNotConfiguredError } from "./auth";
import {
  attachFixtures,
  classifySquad,
  indexById,
  mapPicksToSquad,
  normalizePlayer,
  tenthsToMillions,
} from "./normalize";
import type { FplBootstrapStatic, FplFixture, FplPick, Player, SquadPlayer } from "./types";

const MY_TEAM_REVALIDATE_SECONDS = 60;

const myTeamPickSchema = z.object({
  element: z.number().int().positive(),
  position: z.number().int().min(1).max(15),
  multiplier: z.number().int().min(0).max(3),
  is_captain: z.boolean(),
  is_vice_captain: z.boolean(),
  selling_price: z.number().int().optional(),
  purchase_price: z.number().int().optional(),
});

const myTeamResponseSchema = z.object({
  picks: z.array(myTeamPickSchema).length(15),
  transfers: z.object({
    bank: z.number().int(),
    limit: z.number().int().nullable(),
    made: z.number().int(),
    value: z.number().int(),
  }),
  chips: z
    .array(
      z.object({
        name: z.string(),
        status_for_entry: z.string(),
      }),
    )
    .optional(),
});

export type MyTeamData = {
  picks: FplPick[];
  bank: number;
  teamValue: number;
  freeTransfers: number | null;
  transfersMade: number;
};

export type NormalizedMyTeamSquad = {
  squad: SquadPlayer[];
  startingXi: SquadPlayer[];
  bench: SquadPlayer[];
  captain: SquadPlayer | null;
  viceCaptain: SquadPlayer | null;
  bank: number;
  teamValue: number;
};

export class MyTeamUnavailableError extends Error {
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "MyTeamUnavailableError";
    this.cause = cause;
  }
}

function toFplPick(
  pick: z.infer<typeof myTeamPickSchema>,
  elementType?: number,
): FplPick {
  return {
    element: pick.element,
    position: pick.position,
    multiplier: pick.multiplier,
    is_captain: pick.is_captain,
    is_vice_captain: pick.is_vice_captain,
    element_type: elementType,
  };
}

export async function getMyTeam(entryId: number): Promise<MyTeamData> {
  try {
    const raw = await fplAuthenticatedGet<unknown>(
      `/my-team/${entryId}/`,
      { revalidateSeconds: MY_TEAM_REVALIDATE_SECONDS },
    );

    const parsed = myTeamResponseSchema.safeParse(raw);
    if (!parsed.success) {
      throw new MyTeamUnavailableError(
        "FPL My Team response was invalid or incomplete.",
        parsed.error,
      );
    }

    const { picks, transfers } = parsed.data;

    return {
      picks: picks.map((pick) => toFplPick(pick)),
      bank: tenthsToMillions(transfers.bank),
      teamValue: tenthsToMillions(transfers.value),
      freeTransfers: transfers.limit,
      transfersMade: transfers.made,
    };
  } catch (error) {
    if (
      error instanceof FplAuthNotConfiguredError ||
      error instanceof FplAuthError
    ) {
      throw error;
    }
    if (error instanceof MyTeamUnavailableError) {
      throw error;
    }
    throw new MyTeamUnavailableError(
      "Unable to load your current FPL squad.",
      error,
    );
  }
}

export function normalizeMyTeamSquad(input: {
  myTeam: MyTeamData;
  bootstrap: FplBootstrapStatic;
  fixtures: FplFixture[];
  planningGameweekId: number;
}): NormalizedMyTeamSquad {
  const teamsById = indexById(input.bootstrap.teams);
  const typesById = indexById(input.bootstrap.element_types);
  const elementsById = indexById(input.bootstrap.elements);

  const allPlayers = input.bootstrap.elements.map((element) =>
    normalizePlayer(element, teamsById, typesById),
  );
  const playersById = new Map<number, Player>(
    allPlayers.map((player) => [player.id, player]),
  );

  const picksWithTypes = input.myTeam.picks.map((pick) => {
    const element = elementsById.get(pick.element);
    return toFplPick(
      {
        element: pick.element,
        position: pick.position,
        multiplier: pick.multiplier,
        is_captain: pick.is_captain,
        is_vice_captain: pick.is_vice_captain,
      },
      element?.element_type,
    );
  });

  const mapped = mapPicksToSquad(picksWithTypes, playersById);
  const squad = attachFixtures(
    mapped,
    input.fixtures,
    teamsById,
    input.planningGameweekId,
  );
  const { startingXi, bench, captain, viceCaptain } = classifySquad(squad);

  return {
    squad,
    startingXi,
    bench,
    captain,
    viceCaptain,
    bank: input.myTeam.bank,
    teamValue: input.myTeam.teamValue,
  };
}
