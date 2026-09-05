import type { ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  tone?: "neutral" | "gold" | "mint" | "sky" | "rose" | "violet";
  size?: "sm" | "md";
  dot?: boolean;
};

const TONE: Record<NonNullable<BadgeProps["tone"]>, string> = {
  neutral: "bg-white/8 text-white/80 ring-white/12 backdrop-blur-sm",
  gold: "bg-amber-400/20 text-amber-300 ring-amber-400/35 backdrop-blur-sm shadow-[0_0_12px_rgba(251,191,36,0.15)]",
  mint: "bg-emerald-400/15 text-emerald-300 ring-emerald-400/30 backdrop-blur-sm shadow-[0_0_12px_rgba(52,211,153,0.12)]",
  sky: "bg-sky-400/15 text-sky-300 ring-sky-400/30 backdrop-blur-sm shadow-[0_0_12px_rgba(56,189,248,0.12)]",
  rose: "bg-rose-500/15 text-rose-300 ring-rose-500/30 backdrop-blur-sm shadow-[0_0_12px_rgba(244,63,94,0.15)]",
  violet: "bg-violet-500/15 text-violet-300 ring-violet-500/30 backdrop-blur-sm shadow-[0_0_12px_rgba(168,85,247,0.15)]",
};

export function Badge({ children, tone = "neutral", size = "sm", dot = false }: BadgeProps) {
  const sizeClasses = size === "md" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[10px]";
  
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold tracking-wide ring-1 transition-all ${sizeClasses} ${TONE[tone]}`}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            tone === "mint"
              ? "bg-emerald-400 animate-pulse"
              : tone === "gold"
              ? "bg-amber-400"
              : tone === "rose"
              ? "bg-rose-400 animate-pulse"
              : "bg-current"
          }`}
        />
      )}
      {children}
    </span>
  );
}

