import { fplGet } from "./client";
import type { FplFixture } from "./types";

const FIXTURES_REVALIDATE_SECONDS = 60 * 30;

export async function getFixtures(): Promise<FplFixture[]> {
  return fplGet<FplFixture[]>("/fixtures/", {
    revalidateSeconds: FIXTURES_REVALIDATE_SECONDS,
  });
}
