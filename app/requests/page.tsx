import { AppShell } from "@/components/AppShell";
import { auth } from "@/auth";
import { isAdminUser } from "@/lib/authz";
import { UserRequestsDashboard } from "@/components/UserRequestsDashboard";
import { AdminRequestsDashboard } from "@/components/AdminRequestsDashboard";

export const metadata = {
  title: "Requests · Review & Approval System",
  description: "Track and manage content submission requests.",
};

export default async function RequestsPage() {
  const session = await auth();
  if (!session?.user) {
    return (
      <AppShell>
        <div className="rounded-2xl border border-border/60 bg-card p-8">
          <h1 className="text-2xl font-bold text-foreground">Unauthorized</h1>
          <p className="text-muted-foreground mt-2">Please sign in to view this page.</p>
        </div>
      </AppShell>
    );
  }

  const isAdmin = await isAdminUser(session.user.id);

  return (
    <AppShell>
      {isAdmin ? <AdminRequestsDashboard /> : <UserRequestsDashboard />}
    </AppShell>
  );
}
