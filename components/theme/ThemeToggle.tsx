"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, Laptop, Moon, Sun } from "lucide-react";
import { ThemeIcon } from "@/components/theme/ThemeIcon";
import { useTheme } from "@/components/theme/ThemeProvider";
import { THEMES, type ThemeMode } from "@/lib/theme/types";

export function ThemeToggle() {
  const { theme, mode, isDark, setTheme, setMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const currentTheme = THEMES.find((t) => t.id === theme) || THEMES[0];

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`Theme: ${currentTheme.name} (${mode})`}
        className="group inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/80 shadow-[0_4px_16px_rgba(0,0,0,0.15)] backdrop-blur-xl transition-all duration-200 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
      >
        <span
          className="flex h-5 w-5 items-center justify-center rounded-lg ring-1 ring-white/15 transition-transform duration-200 group-hover:scale-110"
          style={{
            backgroundColor: `${currentTheme.colors.primary}25`,
            color: currentTheme.colors.primary,
          }}
        >
          <ThemeIcon themeId={theme} className="h-3 w-3" strokeWidth={2.5} />
        </span>

        <span className="hidden sm:inline font-medium text-white/90">
          {currentTheme.name}
        </span>

        <span className="inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: currentTheme.colors.primary }} />

        <ChevronDown
          className={`h-3.5 w-3.5 text-white/50 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 z-50 mt-2 w-72 origin-top-right rounded-3xl border border-white/15 bg-slate-950/90 p-3 shadow-[0_24px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl ring-1 ring-black/50 animate-in fade-in zoom-in-95 duration-150"
          style={{
            background: isDark
              ? "rgba(10, 14, 23, 0.95)"
              : "rgba(255, 255, 255, 0.96)",
          }}
        >
          {/* Mode Selector Segment */}
          <div className="mb-3 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
            <div className="grid grid-cols-3 gap-1 text-[11px] font-semibold">
              {(
                [
                  { id: "system", label: "Auto", icon: Laptop },
                  { id: "light", label: "Light", icon: Sun },
                  { id: "dark", label: "Dark", icon: Moon },
                ] as const
              ).map((m) => {
                const active = mode === m.id;
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMode(m.id as ThemeMode)}
                    className={`flex items-center justify-center gap-1.5 rounded-xl py-1.5 transition-all duration-150 ${
                      active
                        ? "bg-white/15 text-white shadow-sm ring-1 ring-white/20"
                        : "text-white/60 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Theme List */}
          <div className="space-y-1">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white/40">
              Stadium Palettes
            </div>
            {THEMES.map((item) => {
              const isSelected = theme === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setTheme(item.id);
                  }}
                  className={`group flex w-full items-center justify-between gap-3 rounded-2xl px-2.5 py-2 text-left transition-all duration-150 ${
                    isSelected
                      ? "bg-white/[0.12] ring-1 ring-white/20 text-white"
                      : "text-white/70 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Swatch Pill */}
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ring-1 ring-white/10 overflow-hidden shadow-inner"
                      style={{ backgroundColor: item.colors.background }}
                    >
                      <ThemeIcon
                        themeId={item.id}
                        className="h-3.5 w-3.5"
                        style={{ color: item.colors.primary }}
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold leading-snug">
                        {item.name}
                      </p>
                      <p className="truncate text-[10px] font-medium text-white/40">
                        {item.tagline}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <div
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-slate-950 shadow-sm"
                      style={{ backgroundColor: item.colors.primary }}
                    >
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer Link */}
          <div className="mt-2 border-t border-white/10 pt-2 text-center">
            <Link
              href="/settings/theme"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center justify-center text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Open Theme Showroom →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
