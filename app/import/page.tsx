"use client";

import { Navbar } from "@/components/Navbar";
import dynamic from "next/dynamic";

const ImportTest = dynamic(() => import("@/components/ImportTest").then((mod) => mod.ImportTest), {
  ssr: false,
});

export default function ImportPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background w-full">
        <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-8">
          <ImportTest />
        </div>
      </main>
    </>
  );
}
