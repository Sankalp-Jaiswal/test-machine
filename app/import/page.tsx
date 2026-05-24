"use client";

import { ImportTest } from "@/components/ImportTest";
import { Navbar } from "@/components/Navbar";

export default function ImportPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
          <ImportTest />
        </div>
      </main>
    </>
  );
}
