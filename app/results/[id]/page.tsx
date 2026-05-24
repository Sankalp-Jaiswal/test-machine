"use client";

import { ResultsScreen } from "@/components/ResultsScreen";
import { Suspense } from "react";

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-muted-foreground">Loading results...</div>}>
      <ResultsScreen attemptId={id} />
    </Suspense>
  );
}
