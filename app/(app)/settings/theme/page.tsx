import type { Metadata } from "next";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { ThemeSettings } from "@/components/theme/ThemeSettings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Appearance & Themes — FPL Command Center",
  description: "Customize stadium atmospheric lighting, palettes, and light/dark modes.",
};

export default function ThemeSettingsPage() {
  return (
    <div>
      <SettingsTabs />
      <ThemeSettings />
    </div>
  );
}
