"use client";

import { ResultsScreen } from "@/components/ResultsScreen";
import { Suspense, use } from "react";

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-muted-foreground">Loading results...</div>}>
      <ResultsScreen attemptId={id} />
    </Suspense>
  );
}
