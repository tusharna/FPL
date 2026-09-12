import { describe, expect, it } from "vitest";
import {
  isValidThemeId,
  parseStoredMode,
  parseStoredThemeId,
} from "@/lib/theme/storage";
import {
  DEFAULT_DARK_THEME,
  DEFAULT_LIGHT_THEME,
  getThemeById,
  resolveEffectiveTheme,
  THEMES,
} from "@/lib/theme/types";

describe("Theme System", () => {
  it("defines all curated stadium themes", () => {
    const ids = THEMES.map((t) => t.id);
    expect(ids).toContain("midnight");
    expect(ids).toContain("premier-league");
    expect(ids).toContain("champions");
    expect(ids).toContain("ocean");
    expect(ids).toContain("daylight");
  });

  it("each theme has valid required properties and color tokens", () => {
    for (const t of THEMES) {
      expect(t.id).toBeDefined();
      expect(t.name.length).toBeGreaterThan(0);
      expect(t.tagline.length).toBeGreaterThan(0);
      expect(t.description.length).toBeGreaterThan(0);
      expect(typeof t.isDark).toBe("boolean");
      expect(t.colors.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(t.colors.accent).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(t.colors.background).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(t.colors.grassPrimary).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(t.colors.grassSecondary).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it("correctly identifies dark and light themes", () => {
    const daylight = getThemeById("daylight");
    expect(daylight.isDark).toBe(false);

    const midnight = getThemeById("midnight");
    expect(midnight.isDark).toBe(true);

    const pl = getThemeById("premier-league");
    expect(pl.isDark).toBe(true);

    const champions = getThemeById("champions");
    expect(champions.isDark).toBe(true);

    const ocean = getThemeById("ocean");
    expect(ocean.isDark).toBe(true);
  });

  it("getThemeById returns fallback for unknown theme id", () => {
    const fallback = getThemeById("unknown-theme");
    expect(fallback.id).toBe(THEMES[0].id);
  });

  it("validates stored theme ids", () => {
    expect(isValidThemeId("midnight")).toBe(true);
    expect(isValidThemeId("legacy-theme")).toBe(false);
    expect(isValidThemeId(null)).toBe(false);
    expect(parseStoredThemeId("legacy-theme")).toBe(DEFAULT_DARK_THEME);
    expect(parseStoredThemeId("ocean")).toBe("ocean");
  });

  it("validates stored appearance modes", () => {
    expect(parseStoredMode("system")).toBe("system");
    expect(parseStoredMode("light")).toBe("light");
    expect(parseStoredMode("dark")).toBe("dark");
    expect(parseStoredMode("invalid")).toBe("system");
    expect(parseStoredMode(null)).toBe("system");
  });

  describe("resolveEffectiveTheme", () => {
    it("returns daylight when mode is light regardless of active dark theme", () => {
      expect(resolveEffectiveTheme("light", "midnight", true)).toBe("daylight");
      expect(resolveEffectiveTheme("light", "premier-league", false)).toBe("daylight");
    });

    it("returns active dark theme when mode is dark", () => {
      expect(resolveEffectiveTheme("dark", "premier-league", false)).toBe("premier-league");
      expect(resolveEffectiveTheme("dark", "champions", false)).toBe("champions");
      expect(resolveEffectiveTheme("dark", "ocean", false)).toBe("ocean");
    });

    it("falls back to default dark theme when mode is dark but active theme was daylight", () => {
      expect(resolveEffectiveTheme("dark", "daylight", false)).toBe(DEFAULT_DARK_THEME);
    });

    it("resolves system mode based on system preference", () => {
      // When system is dark
      expect(resolveEffectiveTheme("system", "premier-league", true)).toBe("premier-league");
      expect(resolveEffectiveTheme("system", "daylight", true)).toBe(DEFAULT_DARK_THEME);

      // When system is light
      expect(resolveEffectiveTheme("system", "midnight", false)).toBe(DEFAULT_LIGHT_THEME);
      expect(resolveEffectiveTheme("system", "champions", false)).toBe("daylight");
    });
  });
});
