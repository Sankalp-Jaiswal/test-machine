// components/PracticeWizard/ReviewStep.tsx
"use client";

import { Card } from "@/components/ui/card";
import { Hash, Clock, Shuffle } from "lucide-react";
import ReviewTile from "./ReviewTile";
import type { Difficulty, QuestionOrderMode } from "@/types";

interface Props {
  sections: string[];
  difficulties: Difficulty[];
  count: number;
  duration: number;
  shuffleOpts: boolean;
  orderMode: QuestionOrderMode;
  totalPool: number;
}

export default function ReviewStep({
  sections,
  difficulties,
  count,
  duration,
  shuffleOpts,
  orderMode,
  totalPool,
}: Props) {
  return (
    <Card className="glass rounded-2xl p-6 border-border/60 space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Ready to go</h2>
        <p className="text-xs text-muted-foreground">
          Sourcing from <span className="text-foreground font-semibold">{totalPool}</span> question
          {totalPool === 1 ? "" : "s"} in your pool.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ReviewTile label="Questions" value={`${count}`} icon={Hash} />
        <ReviewTile label="Duration" value={`${duration} min`} icon={Clock} />
        <ReviewTile label="Source" value={formatOrderMode(orderMode)} icon={Shuffle} />
        <ReviewTile label="Options" value={shuffleOpts ? "Shuffled" : "A→D"} icon={Shuffle} />
      </div>

      <div className="rounded-xl bg-secondary/40 border border-border/60 p-4 space-y-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-2">
            Sections ({sections.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {sections.map((s) => (
              <span
                key={s}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-primary/10 text-primary ring-1 ring-primary/30"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-2">
            Difficulty
          </p>
          <div className="flex flex-wrap gap-1.5">
            {difficulties.map((d) => (
              <span
                key={d}
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] uppercase tracking-[0.14em] font-semibold ring-1 ${
                  d === "easy"
                    ? "bg-success/10 text-success ring-success/30"
                    : d === "medium"
                    ? "bg-warning/10 text-warning ring-warning/30"
                    : "bg-destructive/10 text-destructive ring-destructive/30"
                }`}
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function formatOrderMode(mode: QuestionOrderMode): string {
  if (mode === "earliest") return "Earliest";
  if (mode === "random") return "Random";
  return "Latest";
}
