import { Dashboard } from "@/components/Dashboard";
import { AppShell } from "@/components/AppShell";
import LandingPage from "@/components/LandingPage";
import { auth } from "@/auth";

export const metadata = {
  title: "Test Arena - Dashboard",
  description: "Prepare for CIL MT exams with interactive mock tests",
};

export default async function Page() {
  const session = await auth();
  if (!session?.user) {
    return <LandingPage />;
  }
  return (
    <AppShell>
      <Dashboard />
    </AppShell>
  );
}

