"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Palette } from "lucide-react";

export function SettingsTabs() {
  const pathname = usePathname();

  const tabs = [
    {
      href: "/settings/notifications",
      label: "Notifications",
      description: "Email & alerts",
      icon: Bell,
    },
    {
      href: "/settings/theme",
      label: "Appearance & Themes",
      description: "Palettes & styling",
      icon: Palette,
    },
  ];

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-1.5 backdrop-blur-xl">
      {tabs.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        const Icon = tab.icon;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-150 ${
              active
                ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30 shadow-[0_2px_12px_rgba(16,185,129,0.2)]"
                : "text-white/60 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            <Icon className={`h-4 w-4 ${active ? "text-emerald-300" : "text-white/40"}`} />
            <span>{tab.label}</span>
            <span className="hidden sm:inline text-[10px] font-normal opacity-60">
              · {tab.description}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
