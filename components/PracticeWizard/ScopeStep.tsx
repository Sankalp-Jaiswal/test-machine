// components/PracticeWizard/ScopeStep.tsx
"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, Hash, ListStart, RotateCcw, Shuffle } from "lucide-react";
import type { QuestionOrderMode } from "@/types";
import type { ElementType } from "react";

interface Props {
  poolSize: number;
  questionCount: number | "all";
  setQuestionCount: (n: number | "all") => void;
  duration: number;
  setDuration: (n: number) => void;
  shuffleOpts: boolean;
  setShuffleOpts: (v: boolean) => void;
  orderMode: QuestionOrderMode;
  setOrderMode: (v: QuestionOrderMode) => void;
}

export default function ScopeStep({
  poolSize,
  questionCount,
  setQuestionCount,
  duration,
  setDuration,
  shuffleOpts,
  setShuffleOpts,
  orderMode,
  setOrderMode,
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

      <div className="rounded-2xl border border-border/60 bg-secondary/40 p-4 space-y-3">
        <div>
          <Label className="text-xs font-semibold text-foreground flex items-center gap-2 mb-1">
            <ListStart className="w-3.5 h-3.5 text-primary" /> Question source
          </Label>
          <p className="text-[11px] text-muted-foreground">
            Latest batch is the default. Earliest starts from the beginning. Random samples across the whole match.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <SourceOption
            active={orderMode === "latest"}
            icon={ListStart}
            title="Latest batch"
            description="Newest matching questions first"
            onClick={() => setOrderMode("latest")}
          />
          <SourceOption
            active={orderMode === "earliest"}
            icon={RotateCcw}
            title="Earliest batch"
            description="Oldest matching questions first"
            onClick={() => setOrderMode("earliest")}
          />
          <SourceOption
            active={orderMode === "random"}
            icon={Shuffle}
            title="Random mix"
            description="Sample from all matches"
            onClick={() => setOrderMode("random")}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-secondary/40 p-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="text-xs font-semibold text-foreground flex items-center gap-2">
          <Shuffle className="w-3.5 h-3.5 text-primary" /> Option order
        </div>
        <div className="flex gap-2">
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

function SourceOption({
  active,
  icon: Icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: ElementType;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-3 text-left transition-colors ring-focus ${
        active
          ? "border-primary/50 bg-primary/10 text-foreground"
          : "border-border/60 bg-background/70 text-muted-foreground hover:text-foreground hover:border-primary/30"
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <p className="mt-1 text-[11px] leading-relaxed">{description}</p>
    </button>
  );
}
