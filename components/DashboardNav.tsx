"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DASHBOARD_SECTIONS } from "@/lib/navigation";

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Dashboard sections"
      className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] p-1.5"
    >
      <ul className="flex min-w-max gap-1">
        {DASHBOARD_SECTIONS.map((section) => {
          const active = pathname === section.href || pathname.startsWith(`${section.href}/`);
          return (
            <li key={section.href}>
              <Link
                href={section.href}
                className={`flex flex-col rounded-xl px-4 py-2.5 transition sm:px-5 ${
                  active
                    ? "bg-emerald-400 text-slate-950 shadow-[0_8px_24px_rgba(52,211,153,0.25)]"
                    : "text-white/70 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                <span className="text-sm font-semibold">{section.label}</span>
                <span
                  className={`mt-0.5 text-[10px] ${
                    active ? "text-slate-800/80" : "text-white/40"
                  }`}
                >
                  {section.description}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
