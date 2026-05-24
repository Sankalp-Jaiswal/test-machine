"use client";

import { TestEngine } from "@/components/TestEngine";
import { Suspense } from "react";

export default function TestPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-muted-foreground">Loading test...</div>}>
      <TestEngine testId={params.id} />
    </Suspense>
  );
}
