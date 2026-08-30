import { fplGet } from "./client";
import type { FplBootstrapStatic } from "./types";

const BOOTSTRAP_REVALIDATE_SECONDS = 60 * 30;

export async function getBootstrapStatic(): Promise<FplBootstrapStatic> {
  return fplGet<FplBootstrapStatic>("/bootstrap-static/", {
    revalidateSeconds: BOOTSTRAP_REVALIDATE_SECONDS,
  });
}
