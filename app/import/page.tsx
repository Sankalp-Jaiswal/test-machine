import { AppShell } from "@/components/AppShell";
import dynamic from "next/dynamic";
import { auth } from "@/auth";
import { isAdminUser } from "@/lib/authz";

const ImportTest = dynamic(() => import("@/components/ImportTest").then((mod) => mod.ImportTest), {
  ssr: false,
});

export default async function ImportPage() {
  const session = await auth();
  const isAdmin = await isAdminUser(session?.user?.id);
  return (
    <AppShell>
      {isAdmin ? (
        <ImportTest />
      ) : (
        <div className="rounded-2xl border border-border/60 bg-card p-8">
          <h1 className="text-2xl font-bold text-foreground">Admin only</h1>
          <p className="text-muted-foreground mt-2">
            Question import is restricted to admin accounts.
          </p>
        </div>
      )}
    </AppShell>
  );
}
