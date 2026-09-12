"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_DARK_THEME,
  DEFAULT_LIGHT_THEME,
  getThemeById,
  resolveEffectiveTheme,
  type ThemeDefinition,
  type ThemeId,
  type ThemeMode,
} from "@/lib/theme/types";
import {
  applyThemeToDocument,
  parseStoredMode,
  parseStoredThemeId,
  STORAGE_MODE_KEY,
  STORAGE_THEME_KEY,
} from "@/lib/theme/storage";

type ThemeContextValue = {
  theme: ThemeId;
  selectedTheme: ThemeId;
  mode: ThemeMode;
  isDark: boolean;
  themeDefinition: ThemeDefinition;
  setTheme: (theme: ThemeId) => void;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getInitialTheme(): ThemeId {
  if (typeof window === "undefined") return DEFAULT_DARK_THEME;
  try {
    return parseStoredThemeId(localStorage.getItem(STORAGE_THEME_KEY));
  } catch {
    return DEFAULT_DARK_THEME;
  }
}

function getInitialMode(): ThemeMode {
  if (typeof window === "undefined") return "system";
  try {
    return parseStoredMode(localStorage.getItem(STORAGE_MODE_KEY));
  } catch {
    return "system";
  }
}

function getInitialPrefersDark(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return true;
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [selectedTheme, setSelectedThemeState] = useState<ThemeId>(getInitialTheme);
  const [mode, setModeState] = useState<ThemeMode>(getInitialMode);
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(getInitialPrefersDark);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = (e: MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches);
    };

    mediaQuery.addEventListener("change", handleMediaChange);
    return () => {
      mediaQuery.removeEventListener("change", handleMediaChange);
    };
  }, []);

  const effectiveTheme = useMemo(() => {
    return resolveEffectiveTheme(mode, selectedTheme, systemPrefersDark);
  }, [mode, selectedTheme, systemPrefersDark]);

  useEffect(() => {
    applyThemeToDocument(effectiveTheme, mode);
  }, [effectiveTheme, mode]);

  const isDark = effectiveTheme !== "daylight";
  const themeDefinition = useMemo(() => getThemeById(effectiveTheme), [effectiveTheme]);

  const setTheme = useCallback(
    (newThemeId: ThemeId) => {
      setSelectedThemeState(newThemeId);
      try {
        localStorage.setItem(STORAGE_THEME_KEY, newThemeId);
      } catch {}

      if (newThemeId === "daylight" && mode === "dark") {
        setModeState("light");
        try {
          localStorage.setItem(STORAGE_MODE_KEY, "light");
        } catch {}
      } else if (newThemeId !== "daylight" && mode === "light") {
        setModeState("dark");
        try {
          localStorage.setItem(STORAGE_MODE_KEY, "dark");
        } catch {}
      }
    },
    [mode]
  );

  const setMode = useCallback(
    (newMode: ThemeMode) => {
      setModeState(newMode);
      try {
        localStorage.setItem(STORAGE_MODE_KEY, newMode);
      } catch {}

      if (newMode === "light") {
        setSelectedThemeState(DEFAULT_LIGHT_THEME);
        try {
          localStorage.setItem(STORAGE_THEME_KEY, DEFAULT_LIGHT_THEME);
        } catch {}
      } else if (newMode === "dark" && selectedTheme === "daylight") {
        setSelectedThemeState(DEFAULT_DARK_THEME);
        try {
          localStorage.setItem(STORAGE_THEME_KEY, DEFAULT_DARK_THEME);
        } catch {}
      }
    },
    [selectedTheme]
  );

  const toggleMode = useCallback(() => {
    if (isDark) {
      setMode("light");
    } else {
      setMode("dark");
    }
  }, [isDark, setMode]);

  const value = useMemo(
    () => ({
      theme: effectiveTheme,
      selectedTheme,
      mode,
      isDark,
      themeDefinition,
      setTheme,
      setMode,
      toggleMode,
    }),
    [effectiveTheme, selectedTheme, mode, isDark, themeDefinition, setTheme, setMode, toggleMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
