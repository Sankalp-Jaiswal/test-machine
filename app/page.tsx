import { Dashboard } from "@/components/Dashboard";
import { Navbar } from "@/components/Navbar";

export const metadata = {
  title: "CIL MT Prep Arena - Dashboard",
  description: "Prepare for CIL MT exams with interactive mock tests",
};

export default function Page() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
          <Dashboard />
        </div>
      </main>
    </>
  );
}
