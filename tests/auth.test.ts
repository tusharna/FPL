import { describe, expect, it } from "vitest";
import {
  isCronPath,
  isProtectedApiPath,
  isPublicPath,
} from "@/lib/auth/middleware";
import { sanitizeRedirectPath } from "@/lib/auth/redirect";

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
