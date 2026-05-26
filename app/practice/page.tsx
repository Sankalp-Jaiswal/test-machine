import { PracticeWizard } from "@/components/PracticeWizard";
import { AppShell } from "@/components/AppShell";

export const metadata = {
  title: "Practice · Build a session",
  description: "Pick sections, difficulty, count, and time — then go.",
};

export default function PracticePage() {
  return (
    <AppShell>
      <PracticeWizard />
    </AppShell>
  );
}
