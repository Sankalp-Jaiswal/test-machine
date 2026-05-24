"use client";

import { TestEngine } from "@/components/TestEngine";
import { Suspense, use } from "react";

export default function TestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-muted-foreground">Loading test...</div>}>
      <TestEngine testId={id} />
    </Suspense>
  );
}
