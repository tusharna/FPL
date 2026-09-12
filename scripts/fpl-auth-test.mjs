#!/usr/bin/env node
/**
 * Validates FPL API authentication from .env.local
 * Usage: node --env-file=.env.local scripts/fpl-auth-test.mjs
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const OIDC_TOKEN_URL = "https://account.premierleague.com/as/token";
const OIDC_CLIENT_ID = "bfcbaf69-aade-4c1b-8f00-c1cb8a193030";
const ENTRY_ID = process.env.FPL_ENTRY_ID ?? process.env.FPL_BOOTSTRAP_ENTRY_ID ?? "3944035";

function loadStoredToken() {
  const file = join(process.cwd(), ".fpl-refresh-token");
  if (!existsSync(file)) return null;
  return readFileSync(file, "utf8").trim() || null;
}

async function testAccessToken(token) {
  const res = await fetch(
    `https://fantasy.premierleague.com/api/my-team/${ENTRY_ID}/`,
    {
      headers: {
        Accept: "application/json",
        "X-API-Authorization": `Bearer ${token}`,
        "User-Agent": "fpl-report/0.1 (auth-test)",
      },
    },
  );
  if (!res.ok) {
    throw new Error(`my-team failed: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return data?.picks?.length ?? 0;
}

async function exchangeRefreshToken(refreshToken) {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: OIDC_CLIENT_ID,
  });
  const res = await fetch(OIDC_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
  });
  const payload = await res.json();
  if (!res.ok || !payload.access_token) {
    throw new Error(
      `${payload.error ?? res.status}: ${payload.error_description ?? "token exchange failed"}`,
    );
  }
  return payload;
}

async function main() {
  console.log("FPL Auth Test");
  console.log("=============");
  console.log("Entry ID:", ENTRY_ID);

  const accessToken = process.env.FPL_ACCESS_TOKEN?.trim();
  if (accessToken) {
    const bare = accessToken.startsWith("Bearer ")
      ? accessToken.slice("Bearer ".length)
      : accessToken;
    try {
      const count = await testAccessToken(bare);
      console.log("✓ FPL_ACCESS_TOKEN works —", count, "players loaded");
      return;
    } catch (error) {
      console.error("✗ FPL_ACCESS_TOKEN failed:", error.message);
      console.log("\nCopy a fresh token from DevTools → Network → my-team request → x-api-authorization header");
    }
  }

  const stored = loadStoredToken();
  const envRefresh = process.env.FPL_REFRESH_TOKEN?.trim();
  const candidates = [
    ["FPL_REFRESH_TOKEN (.env.local)", envRefresh],
    [".fpl-refresh-token (auto-saved)", stored],
  ].filter(([, token]) => Boolean(token));

  if (candidates.length === 0) {
    console.error("\n✗ No FPL credentials found.");
    console.log("\nOption A — Quick (expires ~8h):");
    console.log("  1. Log in at fantasy.premierleague.com");
    console.log("  2. DevTools → Network → filter 'my-team'");
    console.log("  3. Copy x-api-authorization header value into FPL_ACCESS_TOKEN");
    console.log("\nOption B — Long-lived refresh token:");
    console.log("  1. DevTools → Console, run:");
    console.log("     copy(JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>k.startsWith('oidc.user:')))).refresh_token)");
    console.log("  2. Paste into FPL_REFRESH_TOKEN in .env.local");
    console.log("  3. Restart npm run dev immediately (token rotates on first use)");
    process.exit(1);
  }

  for (const [label, token] of candidates) {
    console.log(`\nTesting ${label}...`);
    try {
      const payload = await exchangeRefreshToken(token);
      const count = await testAccessToken(payload.access_token);
      console.log(`✓ ${label} works —`, count, "players loaded");
      if (payload.refresh_token && payload.refresh_token !== token) {
        console.log("  → Token rotated. Saving to .fpl-refresh-token");
        const { writeFileSync } = await import("node:fs");
        writeFileSync(".fpl-refresh-token", `${payload.refresh_token}\n`, "utf8");
        console.log("  → Update FPL_REFRESH_TOKEN in .env.local with the new token if needed");
      }
      return;
    } catch (error) {
      console.error(`✗ ${label} failed:`, error.message);
    }
  }

  console.log("\nAll refresh tokens failed. Use FPL_ACCESS_TOKEN for immediate access (see Option A above).");
  process.exit(1);
}

main();
