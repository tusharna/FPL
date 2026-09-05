import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string;
  icon: LucideIcon;
  accent?: string;
  subValue?: string;
};

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = "text-emerald-300",
  subValue,
}: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.25)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.05] hover:shadow-[0_20px_40px_rgba(0,0,0,0.35)] before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-linear-to-r before:from-transparent before:via-white/25 before:to-transparent">
      <div className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-emerald-400/10 blur-2xl transition duration-500 group-hover:scale-125 group-hover:bg-emerald-400/20" />
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
          {label}
        </p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.06] ring-1 ring-white/10 transition-colors duration-300 group-hover:bg-white/[0.1] ${accent}`}>
          <Icon className="h-4 w-4" strokeWidth={2.2} />
        </span>
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-2">
        <p className="text-2xl font-bold tracking-tight text-white tabular-nums">
          {value}
        </p>
        {subValue && (
          <span className="text-[11px] font-medium text-white/40 tabular-nums">
            {subValue}
          </span>
        )}
      </div>
    </div>
  );
}

