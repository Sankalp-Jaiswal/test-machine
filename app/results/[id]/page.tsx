"use client";

import { ResultsScreen } from "@/components/ResultsScreen";
import { Suspense } from "react";

export default function ResultsPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-muted-foreground">Loading results...</div>}>
      <ResultsScreen attemptId={params.id} />
    </Suspense>
  );
}
