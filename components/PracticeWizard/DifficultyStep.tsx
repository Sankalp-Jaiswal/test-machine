// components/PracticeWizard/DifficultyStep.tsx
"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Difficulty } from "@/types";

interface Props {
  counts: Record<Difficulty, number>;
  selected: Difficulty[];
  onChange: (next: Difficulty[]) => void;
}

export default function DifficultyStep({ counts, selected, onChange }: Props) {
  const ALL_DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
  const allSelected = selected.length === ALL_DIFFICULTIES.length;
  const total = selected.reduce((sum, d) => sum + (counts[d] || 0), 0);

  const tones: Record<Difficulty, string> = {
    easy: "border-success/40 bg-success/10 text-success",
    medium: "border-warning/40 bg-warning/10 text-warning",
    hard: "border-destructive/40 bg-destructive/10 text-destructive",
  };

  return (
    <Card className="glass rounded-2xl p-6 border-border/60">
      <div className="flex items-start justify-between mb-5 gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Pick difficulty</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Choose one, several, or all. Each chip shows how many questions are available.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="rounded-full" onClick={() => onChange(allSelected ? [] : ALL_DIFFICULTIES)}>
            {allSelected ? "Clear all" : "Select all"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {ALL_DIFFICULTIES.map((d) => {
          const sel = selected.includes(d);
          return (
            <button
              key={d}
              type="button"
              onClick={() => {
                onChange(sel ? selected.filter((x) => x !== d) : [...selected, d]);
              }}
              className={`text-left rounded-xl p-3 border transition-all flex items-center gap-3 ${
                sel ? tones[d] + " bg-primary/10" : "border-border/60 bg-secondary/30 hover:border-primary/30"
              }`}
            >
              <span
                className={`shrink-0 w-5 h-5 rounded-md grid place-items-center text-[10px] font-bold ${
                  sel ? "bg-primary text-primary-foreground" : "bg-background/80 ring-1 ring-border/70"
                }`}
              >
                {sel ? <Check className="w-3 h-3" /> : ""}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium capitalize text-foreground truncate">{d}</span>
                <span className="block text-[11px] text-muted-foreground">
                  {counts[d] || 0} question{counts[d] === 1 ? "" : "s"}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 rounded-xl bg-secondary/40 border border-border/60 px-4 py-3 text-xs text-muted-foreground">
        Selected: <span className="text-foreground font-semibold">{selected.length}</span> difficulty
        {selected.length === 1 ? "" : "s"} ·{' '}
        <span className="text-foreground font-semibold">{total}</span> question{total === 1 ? "" : "s"} available
      </div>
    </Card>
  );
}
