import type { ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  tone?: "neutral" | "gold" | "mint" | "sky";
};

const TONE: Record<NonNullable<BadgeProps["tone"]>, string> = {
  neutral: "bg-white/10 text-white/80 ring-white/10",
  gold: "bg-amber-300 text-slate-950 ring-amber-200/40",
  mint: "bg-emerald-400/15 text-emerald-200 ring-emerald-300/20",
  sky: "bg-sky-400/15 text-sky-200 ring-sky-300/20",
};

export function Badge({ children, tone = "neutral" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ring-1 ${TONE[tone]}`}
    >
      {children}
    </span>
  );
}
