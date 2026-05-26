import { Profile } from "@/components/Profile";
import { AppShell } from "@/components/AppShell";

export const metadata = {
  title: "Profile · My attempts",
  description: "Every test you've completed, with reports and one-click retry.",
};

export default function ProfilePage() {
  return (
    <AppShell>
      <Profile />
    </AppShell>
  );
}
