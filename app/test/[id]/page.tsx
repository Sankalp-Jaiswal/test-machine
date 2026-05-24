"use client";

import { TestEngine } from "@/components/TestEngine";
import { Suspense } from "react";

export default async function TestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-muted-foreground">Loading test...</div>}>
      <TestEngine testId={id} />
    </Suspense>
  );
}
