import {
  DEFAULT_DARK_THEME,
  DEFAULT_LIGHT_THEME,
  THEMES,
  type ThemeId,
  type ThemeMode,
} from "@/lib/theme/types";

export const STORAGE_THEME_KEY = "fpl_theme";
export const STORAGE_MODE_KEY = "fpl_mode";
export const COOKIE_THEME_KEY = "fpl_theme";
export const COOKIE_MODE_KEY = "fpl_mode";

const VALID_THEME_IDS = new Set<string>(THEMES.map((theme) => theme.id));

export function isValidThemeId(value: string | null | undefined): value is ThemeId {
  return typeof value === "string" && VALID_THEME_IDS.has(value);
}

export function parseStoredThemeId(value: string | null | undefined): ThemeId {
  return isValidThemeId(value) ? value : DEFAULT_DARK_THEME;
}

export function parseStoredMode(value: string | null | undefined): ThemeMode {
  if (value === "dark" || value === "light" || value === "system") {
    return value;
  }
  return "system";
}

export function applyThemeToDocument(effectiveTheme: ThemeId, mode?: ThemeMode) {
  if (typeof document === "undefined") return;

  const isLight = effectiveTheme === DEFAULT_LIGHT_THEME;
  const root = document.documentElement;

  root.setAttribute("data-theme", effectiveTheme);
  if (isLight) {
    root.classList.remove("dark");
    root.classList.add("light");
    root.style.colorScheme = "light";
  } else {
    root.classList.remove("light");
    root.classList.add("dark");
    root.style.colorScheme = "dark";
  }

  const cookieBase = "; path=/; max-age=31536000; SameSite=Lax";
  document.cookie = `${COOKIE_THEME_KEY}=${effectiveTheme}${cookieBase}`;
  if (mode) {
    document.cookie = `${COOKIE_MODE_KEY}=${mode}${cookieBase}`;
  }
}

export function getServerThemeAttributes(themeId: string | null | undefined) {
  if (!isValidThemeId(themeId)) {
    return {};
  }

  const isLight = themeId === DEFAULT_LIGHT_THEME;
  return {
    "data-theme": themeId,
    className: isLight ? "light" : "dark",
    colorScheme: isLight ? "light" : "dark",
  } as const;
}
