// components/PracticeWizard/SectionsStep.tsx
"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface Props {
  allSections: string[];
  sectionCounts: Record<string, number>;
  selectedSections: string[];
  onChange: (next: string[]) => void;
}

export default function SectionsStep({ allSections, sectionCounts, selectedSections, onChange }: Props) {
  const allSelected = selectedSections.length === allSections.length;
  const total = selectedSections.reduce((sum, s) => sum + (sectionCounts[s] || 0), 0);

  return (
    <Card className="glass rounded-2xl p-6 border-border/60">
      <div className="flex items-start justify-between mb-5 gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Pick sections</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Choose one, several, or all. Each chip shows how many questions are available.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="rounded-full" onClick={() => onChange(allSelected ? [] : allSections)}>
            {allSelected ? "Clear all" : "Select all"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {allSections.map((s) => {
          const sel = selectedSections.includes(s);
          return (
            <button
              key={s}
              type="button"
              onClick={() =>
                onChange(sel ? selectedSections.filter((x) => x !== s) : [...selectedSections, s])
              }
              className={`text-left rounded-xl p-3 border transition-all flex items-center gap-3 ${
                sel ? "border-primary/50 bg-primary/10" : "border-border/60 bg-secondary/30 hover:border-primary/30"
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
                <span className="block text-sm font-medium text-foreground truncate">{s}</span>
                <span className="block text-[11px] text-muted-foreground">
                  {sectionCounts[s] || 0} question{sectionCounts[s] === 1 ? "" : "s"}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 rounded-xl bg-secondary/40 border border-border/60 px-4 py-3 text-xs text-muted-foreground">
        Selected: <span className="text-foreground font-semibold">{selectedSections.length}</span> section
        {selectedSections.length === 1 ? "" : "s"} ·{' '}
        <span className="text-foreground font-semibold">{total}</span> question{total === 1 ? "" : "s"} available
      </div>
    </Card>
  );
}
