import { Settings } from "@/components/Settings";
import { AppShell } from "@/components/AppShell";

export const metadata = {
  title: "Settings · Manage question bank",
  description: "Import questions and manage your existing imports.",
};

export default function SettingsPage() {
  return (
    <AppShell>
      <Settings />
    </AppShell>
  );
}
