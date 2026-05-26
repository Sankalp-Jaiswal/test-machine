// components/PracticeWizard/ScopeStep.tsx
"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, Hash, Shuffle } from "lucide-react";

interface Props {
  poolSize: number;
  questionCount: number | "all";
  setQuestionCount: (n: number | "all") => void;
  duration: number;
  setDuration: (n: number) => void;
  shuffleQ: boolean;
  setShuffleQ: (v: boolean) => void;
  shuffleOpts: boolean;
  setShuffleOpts: (v: boolean) => void;
}

export default function ScopeStep({
  poolSize,
  questionCount,
  setQuestionCount,
  duration,
  setDuration,
  shuffleQ,
  setShuffleQ,
  shuffleOpts,
  setShuffleOpts,
}: Props) {
  const effective = questionCount === "all" ? poolSize : Math.min(questionCount, poolSize);

  return (
    <Card className="glass rounded-2xl p-6 border-border/60 space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Count &amp; time</h2>
        <p className="text-xs text-muted-foreground">
          {poolSize} question{poolSize === 1 ? "" : "s"} matched. Pick how many to attempt and the timer.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Question count */}
        <div className="rounded-2xl border border-border/60 bg-secondary/40 p-4">
          <Label className="text-xs font-semibold text-foreground flex items-center gap-2 mb-3">
            <Hash className="w-3.5 h-3.5 text-primary" /> Number of questions
          </Label>
          <div className="flex flex-wrap gap-2 mb-3">
            <Button
              size="sm"
              variant={questionCount === "all" ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setQuestionCount("all")}
            >
              All ({poolSize})
            </Button>
            {[10, 20, 30, 50].map((n) => (
              <Button
                key={n}
                size="sm"
                variant={questionCount === n ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setQuestionCount(n)}
                disabled={n > poolSize}
              >
                {n}
              </Button>
            ))}
          </div>
          <Input
            type="number"
            min={1}
            max={poolSize || 1}
            value={questionCount === "all" ? "" : questionCount}
            placeholder="Custom"
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              if (Number.isNaN(n)) setQuestionCount("all");
              else setQuestionCount(Math.max(1, Math.min(poolSize || 1, n)));
            }}
            className="h-9 bg-background/60 border-border/60 text-sm"
          />
          <p className="text-[11px] text-muted-foreground mt-2">
            Will serve <span className="text-foreground font-semibold">{effective}</span> question{effective === 1 ? "" : "s"}
          </p>
        </div>

        {/* Duration */}
        <div className="rounded-2xl border border-border/60 bg-secondary/40 p-4">
          <Label className="text-xs font-semibold text-foreground flex items-center gap-2 mb-3">
            <Clock className="w-3.5 h-3.5 text-accent" /> Duration (minutes)
          </Label>
          <div className="flex flex-wrap gap-2 mb-3">
            {[15, 30, 45, 60, 90].map((m) => (
              <Button
                key={m}
                size="sm"
                variant={duration === m ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setDuration(m)}
              >
                {m}
              </Button>
            ))}
          </div>
          <Input
            type="number"
            min={1}
            max={999}
            value={duration}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              setDuration(Number.isNaN(n) ? 30 : Math.max(1, n));
            }}
            className="h-9 bg-background/60 border-border/60 text-sm"
          />
          <p className="text-[11px] text-muted-foreground mt-2">
            ~{(duration / Math.max(1, effective)).toFixed(1)} min per question
          </p>
        </div>
      </div>

      {/* Randomization options */}
      <div className="rounded-2xl border border-border/60 bg-secondary/40 p-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="text-xs font-semibold text-foreground flex items-center gap-2">
          <Shuffle className="w-3.5 h-3.5 text-primary" /> Randomization
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={shuffleQ ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setShuffleQ(!shuffleQ)}
          >
            {shuffleQ ? "Shuffling questions" : "Original order"}
          </Button>
          <Button
            size="sm"
            variant={shuffleOpts ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setShuffleOpts(!shuffleOpts)}
          >
            {shuffleOpts ? "Shuffling options" : "Options A→D"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
