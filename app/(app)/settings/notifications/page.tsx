import { NotificationSettings } from "@/components/notifications/NotificationSettings";
import { SettingsTabs } from "@/components/settings/SettingsTabs";

export const dynamic = "force-dynamic";

export default function NotificationSettingsPage() {
  return (
    <div>
      <SettingsTabs />
      <NotificationSettings />
    </div>
  );
}
