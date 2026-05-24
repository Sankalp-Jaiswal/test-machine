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
      <main className="min-h-screen bg-background w-full">
        <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-8">
          <Dashboard />
        </div>
      </main>
    </>
  );
}
