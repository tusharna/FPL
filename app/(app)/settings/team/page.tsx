import type { Metadata } from "next";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { TeamSettings } from "@/components/settings/TeamSettings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FPL Team — FPL Command Center",
  description: "Link the Fantasy Premier League team used by this account.",
};

export default function TeamSettingsPage() {
  return (
    <div>
      <SettingsTabs />
      <TeamSettings />
    </div>
  );
}
