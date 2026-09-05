import { describe, expect, it } from "vitest";
import {
  buildAuthCallbackUrl,
  isCronPath,
  isProtectedApiPath,
  isPublicPath,
  shouldForwardAuthCode,
} from "@/lib/auth/middleware";
import { sanitizeRedirectPath } from "@/lib/auth/redirect";
import { NextRequest } from "next/server";

describe("sanitizeRedirectPath", () => {
  it("allows internal application paths", () => {
    expect(sanitizeRedirectPath("/gameweeks/5")).toBe("/gameweeks/5");
    expect(sanitizeRedirectPath("/squad")).toBe("/squad");
  });

  it("rejects open redirects and auth routes", () => {
    expect(sanitizeRedirectPath("//evil.example")).toBe("/");
    expect(sanitizeRedirectPath("https://evil.example")).toBe("/");
    expect(sanitizeRedirectPath("/login")).toBe("/");
    expect(sanitizeRedirectPath("/auth/callback")).toBe("/");
    expect(sanitizeRedirectPath(null)).toBe("/");
  });
});

describe("middleware route classification", () => {
  it("marks login and auth callback routes as public", () => {
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/auth/callback")).toBe(true);
    expect(isPublicPath("/squad")).toBe(false);
  });

  it("marks cron routes as non-user-auth", () => {
    expect(isCronPath("/api/cron/deadline-check")).toBe(true);
    expect(isProtectedApiPath("/api/cron/deadline-check")).toBe(false);
  });

  it("marks private API routes as protected", () => {
    expect(isProtectedApiPath("/api/report")).toBe(true);
    expect(isProtectedApiPath("/api/history")).toBe(true);
    expect(isProtectedApiPath("/api/intelligence")).toBe(true);
    expect(isProtectedApiPath("/api/notifications")).toBe(true);
  });
});

describe("auth code forwarding", () => {
  it("forwards OAuth codes landing on /login to /auth/callback", () => {
    const request = new NextRequest(
      "https://fpl-robocop.vercel.app/login?code=abc123&next=%2F",
    );

    expect(shouldForwardAuthCode("/login", request.nextUrl.searchParams)).toBe(
      true,
    );

    const callbackUrl = buildAuthCallbackUrl(request);
    expect(callbackUrl.pathname).toBe("/auth/callback");
    expect(callbackUrl.searchParams.get("code")).toBe("abc123");
    expect(callbackUrl.searchParams.get("next")).toBe("/");
  });

  it("does not forward codes already on /auth/callback", () => {
    const params = new URLSearchParams("code=abc123");
    expect(shouldForwardAuthCode("/auth/callback", params)).toBe(false);
  });
});
