export type ThemeId =
  | "midnight"
  | "premier-league"
  | "champions"
  | "ocean"
  | "daylight";

export type ThemeMode = "dark" | "light" | "system";

export type ThemeColors = {
  primary: string;
  accent: string;
  background: string;
  card: string;
  border: string;
  grassPrimary: string;
  grassSecondary: string;
};

export type ThemeDefinition = {
  id: ThemeId;
  name: string;
  tagline: string;
  description: string;
  isDark: boolean;
  colors: ThemeColors;
};

export const THEMES: ThemeDefinition[] = [
  {
    id: "midnight",
    name: "Midnight Stadium",
    tagline: "Tactical Night",
    description: "Deep space obsidian with emerald pitch glow and electric cyan highlights.",
    isDark: true,
    colors: {
      primary: "#10b981",
      accent: "#38bdf8",
      background: "#06090e",
      card: "rgba(255, 255, 255, 0.035)",
      border: "rgba(255, 255, 255, 0.09)",
      grassPrimary: "#0b4522",
      grassSecondary: "#0e542a",
    },
  },
  {
    id: "premier-league",
    name: "Premier League Neon",
    tagline: "Signature Broadcast",
    description: "Iconic royal purple night with vibrant neon magenta and electric green energy.",
    isDark: true,
    colors: {
      primary: "#00ff87",
      accent: "#e90052",
      background: "#120224",
      card: "rgba(255, 255, 255, 0.04)",
      border: "rgba(233, 0, 82, 0.2)",
      grassPrimary: "#07391c",
      grassSecondary: "#0a4723",
    },
  },
  {
    id: "champions",
    name: "Champions Gold",
    tagline: "Trophy Prestige",
    description: "Opulent charcoal and graphite backdrop with warm champagne and metallic gold tones.",
    isDark: true,
    colors: {
      primary: "#eab308",
      accent: "#f59e0b",
      background: "#0a0b0e",
      card: "rgba(255, 255, 255, 0.035)",
      border: "rgba(234, 179, 8, 0.2)",
      grassPrimary: "#0c381d",
      grassSecondary: "#104725",
    },
  },
  {
    id: "ocean",
    name: "Ocean Turf",
    tagline: "Deep Sea Abyss",
    description: "Deep oceanic navy canvas with arctic ice cyan spotlights and sapphire accents.",
    isDark: true,
    colors: {
      primary: "#38bdf8",
      accent: "#6366f1",
      background: "#030c1b",
      card: "rgba(255, 255, 255, 0.035)",
      border: "rgba(56, 189, 248, 0.2)",
      grassPrimary: "#073d32",
      grassSecondary: "#0b4c3e",
    },
  },
  {
    id: "daylight",
    name: "Daylight Arena",
    tagline: "Matchday Sun",
    description: "Crisp, modern stadium daylight with frosted glass cards, slate typography, and fresh turf.",
    isDark: false,
    colors: {
      primary: "#059669",
      accent: "#0284c7",
      background: "#f4f6fa",
      card: "rgba(255, 255, 255, 0.88)",
      border: "rgba(15, 23, 42, 0.09)",
      grassPrimary: "#15803d",
      grassSecondary: "#166534",
    },
  },
];

export const DEFAULT_DARK_THEME: ThemeId = "midnight";
export const DEFAULT_LIGHT_THEME: ThemeId = "daylight";

export function getThemeById(id: string | null | undefined): ThemeDefinition {
  const found = THEMES.find((t) => t.id === id);
  return found ?? THEMES[0];
}

export function resolveEffectiveTheme(
  mode: ThemeMode,
  activeThemeId: ThemeId,
  systemPrefersDark: boolean
): ThemeId {
  if (mode === "light") {
    return "daylight";
  }
  if (mode === "dark") {
    return activeThemeId === "daylight" ? DEFAULT_DARK_THEME : activeThemeId;
  }
  // mode === "system"
  if (systemPrefersDark) {
    return activeThemeId === "daylight" ? DEFAULT_DARK_THEME : activeThemeId;
  }
  return "daylight";
}
