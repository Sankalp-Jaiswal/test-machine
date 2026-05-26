"use client";

import { AppShell } from "@/components/AppShell";
import dynamic from "next/dynamic";

const ImportTest = dynamic(() => import("@/components/ImportTest").then((mod) => mod.ImportTest), {
  ssr: false,
});

export default function ImportPage() {
  return (
    <AppShell>
      <ImportTest />
    </AppShell>
  );
}
