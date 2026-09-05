"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  History,
  Radio,
  Settings,
  Sparkles,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { DASHBOARD_SECTIONS } from "@/lib/navigation";

const SECTION_ICONS: Record<string, LucideIcon> = {
  "/squad": Users,
  "/analysis": TrendingUp,
  "/report": Sparkles,
  "/intelligence": Radio,
  "/notifications": Bell,
  "/settings/notifications": Settings,
  "/gameweeks": History,
};

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Dashboard sections"
      className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-white/[0.03] p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.3)] backdrop-blur-2xl"
    >
      <ul className="flex min-w-max items-center gap-1.5">
        {DASHBOARD_SECTIONS.map((section) => {
          const active = pathname === section.href || pathname.startsWith(`${section.href}/`);
          const Icon = SECTION_ICONS[section.href] || Users;

          return (
            <li key={section.href}>
              <Link
                href={section.href}
                className={`group flex items-center gap-2.5 rounded-xl px-4 py-2.5 transition-all duration-200 ${
                  active
                    ? "bg-emerald-400 text-slate-950 shadow-[0_4px_20px_rgba(52,211,153,0.35)] ring-1 ring-emerald-300"
                    : "text-white/70 hover:bg-white/[0.07] hover:text-white"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    active ? "text-slate-950" : "text-white/50 group-hover:text-emerald-300"
                  }`}
                  strokeWidth={active ? 2.5 : 2}
                />
                <div className="flex flex-col text-left">
                  <span className={`text-xs font-bold leading-tight ${active ? "text-slate-950" : "text-white"}`}>
                    {section.label}
                  </span>
                  <span
                    className={`text-[9px] font-medium leading-none mt-0.5 ${
                      active ? "text-slate-900/75" : "text-white/40"
                    }`}
                  >
                    {section.description}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

