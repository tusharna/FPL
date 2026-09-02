import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string;
  icon: LucideIcon;
  accent?: string;
};

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = "text-emerald-300",
}: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 shadow-[0_12px_40px_rgba(0,0,0,0.18)] backdrop-blur-xl">
      <div className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-emerald-400/8 blur-2xl transition group-hover:bg-emerald-400/16" />
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/45">
          {label}
        </p>
        <span className={`rounded-xl bg-white/6 p-1.5 ${accent}`}>
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-white">{value}</p>
    </div>
  );
}
