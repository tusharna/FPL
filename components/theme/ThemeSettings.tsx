"use client";

import { Check, Laptop, Moon, Palette, Shield, Sun, Wallet } from "lucide-react";
import { ThemeIcon } from "@/components/theme/ThemeIcon";
import { useTheme } from "@/components/theme/ThemeProvider";
import { Panel } from "@/components/ui/Panel";
import { Badge } from "@/components/ui/Badge";
import { THEMES, type ThemeMode } from "@/lib/theme/types";

export function ThemeSettings() {
  const { theme, mode, isDark, setTheme, setMode } = useTheme();

  return (
    <div className="space-y-6">
      {/* Overview Panel */}
      <Panel className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                Appearance & Theme Showroom
              </h2>
              <p className="mt-0.5 text-xs text-white/50">
                Personalize stadium atmospheric lighting, tactical pitch turf, and interface styling.
              </p>
            </div>
          </div>

          <Badge tone="mint" size="md" dot>
            {isDark ? "Dark Aesthetic" : "Light Aesthetic"}
          </Badge>
        </div>

        {/* Mode Selector */}
        <div className="mt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/60">
            Appearance Mode
          </h3>
          <p className="mt-1 text-xs text-white/45">
            Choose whether to follow your operating system appearance or force dark/light presentation.
          </p>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(
              [
                {
                  id: "system",
                  title: "Sync with System",
                  desc: "Automatically adapts based on your device's light or dark mode.",
                  icon: Laptop,
                },
                {
                  id: "light",
                  title: "Daylight Mode",
                  desc: "Crisp white canvas, high-contrast slate text, and daylight stadium turf.",
                  icon: Sun,
                },
                {
                  id: "dark",
                  title: "Night Stadium",
                  desc: "Deep tactical obsidian canvas with vibrant ambient glows and rich neon accents.",
                  icon: Moon,
                },
              ] as const
            ).map((opt) => {
              const active = mode === opt.id;
              const Icon = opt.icon;

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setMode(opt.id as ThemeMode)}
                  className={`group relative flex flex-col items-start rounded-2xl border p-4 text-left transition-all duration-200 ${
                    active
                      ? "border-emerald-400/50 bg-emerald-500/10 shadow-[0_8px_24px_rgba(16,185,129,0.15)] ring-1 ring-emerald-400/40"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                        active
                          ? "bg-emerald-400 text-slate-950"
                          : "bg-white/10 text-white/70 group-hover:text-white"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    {active && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 text-slate-950">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <h4 className="mt-3 text-sm font-bold text-white">{opt.title}</h4>
                  <p className="mt-1 text-xs text-white/50 leading-relaxed">{opt.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Curated Themes Showroom */}
        <div className="mt-8 border-t border-white/[0.08] pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/60">
                Curated Stadium Palettes
              </h3>
              <p className="mt-1 text-xs text-white/45">
                Each palette tailors the stadium ambient lighting, pitch tones, and metric highlights.
              </p>
            </div>
            <span className="text-xs font-semibold text-white/50">
              {THEMES.length} Available
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {THEMES.map((item) => {
              const active = theme === item.id;

              return (
                <div
                  key={item.id}
                  className={`group relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-300 ${
                    active
                      ? "border-emerald-400/50 bg-white/[0.06] shadow-[0_12px_32px_rgba(0,0,0,0.3)] ring-1 ring-emerald-400/40"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                  }`}
                >
                  <div>
                    {/* Header Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="flex h-8 w-8 items-center justify-center rounded-xl ring-1 ring-white/15"
                          style={{
                            backgroundColor: `${item.colors.primary}20`,
                            color: item.colors.primary,
                          }}
                        >
                          <ThemeIcon themeId={item.id} className="h-4 w-4" />
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-white">{item.name}</h4>
                          <span className="text-[10px] font-semibold text-white/45">
                            {item.tagline}
                          </span>
                        </div>
                      </div>

                      <Badge tone={item.isDark ? "neutral" : "mint"}>
                        {item.isDark ? "Dark" : "Light"}
                      </Badge>
                    </div>

                    <p className="mt-3 text-xs leading-relaxed text-white/60">
                      {item.description}
                    </p>

                    {/* Color Swatch Preview */}
                    <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-2">
                        Color Balance
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.05] px-2 py-1">
                          <span
                            className="h-3 w-3 rounded-full ring-1 ring-white/20"
                            style={{ backgroundColor: item.colors.primary }}
                          />
                          <span className="text-[10px] text-white/60 font-medium">Primary</span>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.05] px-2 py-1">
                          <span
                            className="h-3 w-3 rounded-full ring-1 ring-white/20"
                            style={{ backgroundColor: item.colors.accent }}
                          />
                          <span className="text-[10px] text-white/60 font-medium">Accent</span>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.05] px-2 py-1">
                          <span
                            className="h-3 w-3 rounded-full ring-1 ring-white/20"
                            style={{ backgroundColor: item.colors.grassPrimary }}
                          />
                          <span className="text-[10px] text-white/60 font-medium">Turf</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Activation Button */}
                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={() => setTheme(item.id)}
                      className={`w-full rounded-xl py-2 px-3 text-xs font-bold transition-all duration-150 flex items-center justify-center gap-2 ${
                        active
                          ? "bg-emerald-400 text-slate-950 shadow-[0_2px_12px_rgba(52,211,153,0.3)]"
                          : "bg-white/10 text-white hover:bg-white/15"
                      }`}
                    >
                      {active ? (
                        <>
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          Active Palette
                        </>
                      ) : (
                        "Select Palette"
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Interactive Preview */}
        <div className="mt-8 border-t border-white/[0.08] pt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/60">
            Live Surface Preview
          </h3>
          <p className="mt-1 text-xs text-white/45">
            Real-time preview of interface components with the current active theme tokens.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Metric Card Preview */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                  Sample Metric
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-emerald-300">
                  <Wallet className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-white tabular-nums">£104.8m</p>
              <p className="text-[10px] font-medium text-white/40 mt-0.5">Team Value Snapshot</p>
            </div>

            {/* Tactical Badge Preview */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                  Badges & Highlights
                </span>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone="mint">3-4-3 Formation</Badge>
                  <Badge tone="gold">⭐ Captain 2x</Badge>
                  <Badge tone="sky">DEF Clean Sheet</Badge>
                </div>
              </div>
              <p className="mt-2 text-[10px] text-white/40">Automatic high-contrast badge styles</p>
            </div>

            {/* Turf Mini Preview */}
            <div className="rounded-2xl border border-white/10 bg-[#082012] p-4 text-white relative overflow-hidden">
              <div className="tactical-pitch absolute inset-0 opacity-80" />
              <div className="relative z-10">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                  <Shield className="h-3.5 w-3.5" />
                  Matchday Pitch Turf
                </div>
                <p className="mt-1 text-[11px] text-white/80">
                  Alternating cut grass stripes with authentic stadium spotlights.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}
