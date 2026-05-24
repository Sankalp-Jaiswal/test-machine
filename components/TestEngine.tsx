"use client";

import { useAppStore } from "@/store/useAppStore";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import {
  Clock,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Flag,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const OPT_KEYS = ["A", "B", "C", "D"] as const;
type OptKey = (typeof OPT_KEYS)[number];

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function ProgressRing({
  value,
  size = 44,
  stroke = 4,
  className = "",
}: {
  value: number;
  size?: number;
  stroke?: number;
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className={className}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="hsl(240 6% 18%)"
        strokeWidth={stroke}
        fill="none"
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="url(#ring-grad)"
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        animate={{ strokeDashoffset: c * (1 - value / 100) }}
        transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
        style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
      />
      <defs>
        <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(252 87% 67%)" />
          <stop offset="100%" stopColor="hsl(187 92% 60%)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function TestEngine({ testId }: { testId: string }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const questionEnterTime = useRef<number>(Date.now());

  const currentAttempt = useAppStore((s) => s.currentAttempt);
  const getCurrentTest = useAppStore((s) => s.getCurrentTest);
  const updateAnswers = useAppStore((s) => s.updateAnswers);
  const toggleMark = useAppStore((s) => s.toggleMarkForReview);
  const endTest = useAppStore((s) => s.endTest);
  const startTest = useAppStore((s) => s.startTest);
  const isInitialized = useAppStore((s) => s.isInitialized);
  const loadFromStorage = useAppStore((s) => s.loadFromStorage);

  // First, wait for store to initialize
  useEffect(() => {
    if (!isInitialized) {
      loadFromStorage();
    }
  }, [isInitialized, loadFromStorage]);

  // Then, once initialized, start the test
  useEffect(() => {
    if (isInitialized && mounted) {
      startTest(testId);
    }
  }, [testId, startTest, isInitialized, mounted]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const test = getCurrentTest();
  const question = test?.questions[currentQuestionIdx];
  const currentAnswer = (question && currentAttempt?.answers[question.id]) || null;
  const isMarked = !!(question && currentAttempt?.markedForReview.has(question.id));

  // Track per-question time
  useEffect(() => {
    questionEnterTime.current = Date.now();
    return () => {
      if (!question || !currentAttempt) return;
      const spent = Math.round((Date.now() - questionEnterTime.current) / 1000);
      currentAttempt.timePerQuestion[question.id] =
        (currentAttempt.timePerQuestion[question.id] || 0) + spent;
    };
  }, [currentQuestionIdx, question, currentAttempt]);

  const handleSubmit = useCallback(() => {
    if (!currentAttempt || !test) return;
    endTest(currentAttempt.answers, currentAttempt.timePerQuestion);
    router.push(`/results/${currentAttempt.id}`);
  }, [currentAttempt, test, endTest, router]);

  // Timer
  useEffect(() => {
    if (!test || !mounted) return;
    const totalSeconds = test.duration * 60;
    setTimeLeft((prev) => (prev === 0 ? totalSeconds : prev));

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [test, mounted]);

  const handleAnswerChange = useCallback(
    (option: OptKey) => {
      if (!question) return;
      updateAnswers(question.id, currentAnswer === option ? null : option);
    },
    [question, currentAnswer, updateAnswers],
  );

  const goPrev = useCallback(
    () => setCurrentQuestionIdx((i) => Math.max(0, i - 1)),
    [],
  );
  const goNext = useCallback(() => {
    if (!test) return;
    setCurrentQuestionIdx((i) => Math.min(test.questions.length - 1, i + 1));
  }, [test]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (["1", "2", "3", "4"].includes(e.key)) {
        const k = OPT_KEYS[parseInt(e.key, 10) - 1];
        handleAnswerChange(k);
      } else if (e.key.toLowerCase() === "n" || e.key === "ArrowRight") {
        goNext();
      } else if (e.key.toLowerCase() === "p" || e.key === "ArrowLeft") {
        goPrev();
      } else if (e.key.toLowerCase() === "m") {
        if (question) toggleMark(question.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mounted, handleAnswerChange, goNext, goPrev, toggleMark, question]);

  if (!mounted || !isInitialized || !test || !question || !currentAttempt) {
    return (
      <div className="flex items-center justify-center h-screen ambient-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading test…</p>
        </div>
      </div>
    );
  }

  const total = test.questions.length;
  const answeredCount = Object.values(currentAttempt.answers).filter((a) => a !== null).length;
  const markedCount = currentAttempt.markedForReview.size;
  const totalSeconds = test.duration * 60;
  const isTimeWarning = timeLeft < 300;
  const isTimeCritical = timeLeft < 60;
  const timeProgress = Math.max(0, Math.min(100, ((totalSeconds - timeLeft) / totalSeconds) * 100));
  const questionProgress = Math.round(((currentQuestionIdx + 1) / total) * 100);

  return (
    <div className="min-h-screen ambient-bg bg-background">
      {/* Sticky immersive header */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 flex items-center gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl gradient-brand">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {test.testName}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Question {currentQuestionIdx + 1} of {total} ·{" "}
                <span className="text-foreground/80">{answeredCount} answered</span>
                {markedCount > 0 && (
                  <>
                    {" "}· <span className="text-accent">{markedCount} marked</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex-1" />

          <div className="hidden md:flex items-center gap-2">
            <ProgressRing value={questionProgress} />
            <div className="text-xs leading-tight text-muted-foreground">
              <div className="font-semibold text-foreground tabular-nums">{questionProgress}%</div>
              <div>progress</div>
            </div>
          </div>

          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-sm font-bold tabular-nums ring-1 transition-colors ${
              isTimeCritical
                ? "text-destructive ring-destructive/50 bg-destructive/10 animate-pulse"
                : isTimeWarning
                ? "text-warning ring-warning/40 bg-warning/10"
                : "text-foreground ring-border/70 bg-secondary/40"
            }`}
          >
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>

          <Button
            onClick={() => setPaletteOpen(true)}
            variant="outline"
            size="sm"
            className="lg:hidden rounded-full border-border/60"
          >
            Palette
          </Button>

          <Button
            onClick={() => setShowConfirm(true)}
            size="sm"
            className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
          >
            <Flag className="w-3.5 h-3.5" /> Submit
          </Button>
        </div>
        {/* Timer progress bar */}
        <div className="h-[2px] bg-border/30 relative overflow-hidden">
          <motion.div
            className={`h-full ${
              isTimeCritical ? "bg-destructive" : isTimeWarning ? "bg-warning" : "gradient-brand"
            }`}
            style={{ width: `${timeProgress}%` }}
            transition={{ ease: "linear" }}
          />
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto">
        {/* Question */}
        <main className="flex-1 min-w-0">
          <div className="max-w-3xl mx-auto px-4 lg:px-8 py-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <Card className="glass rounded-3xl border-border/60 p-6 md:p-10 mb-6">
                  <div className="flex items-center flex-wrap gap-2 mb-5">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.14em] font-semibold bg-primary/15 text-primary ring-1 ring-primary/30">
                      {question.section}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.14em] font-semibold ring-1 ${
                        question.difficulty === "easy"
                          ? "bg-success/10 text-success ring-success/30"
                          : question.difficulty === "medium"
                          ? "bg-warning/10 text-warning ring-warning/30"
                          : "bg-destructive/10 text-destructive ring-destructive/30"
                      }`}
                    >
                      {question.difficulty}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-1 tabular-nums">
                      Q{currentQuestionIdx + 1} / {total}
                    </span>
                  </div>

                  <h2 className="text-2xl md:text-[28px] leading-snug font-semibold text-foreground tracking-tight">
                    {question.question}
                  </h2>

                  {/* Options */}
                  <div className="space-y-3 mt-8">
                    {OPT_KEYS.map((key, idx) => {
                      const value = question.options[key];
                      const selected = currentAnswer === key;
                      return (
                        <motion.button
                          key={key}
                          type="button"
                          onClick={() => handleAnswerChange(key)}
                          whileTap={{ scale: 0.99 }}
                          className={`group w-full text-left rounded-2xl border transition-all duration-200 ring-focus ${
                            selected
                              ? "border-primary/60 bg-primary/10 shadow-[0_0_0_1px_hsl(var(--primary)/0.5),_0_10px_40px_-12px_hsl(var(--primary)/0.6)]"
                              : "border-border/60 bg-secondary/30 hover:border-primary/30 hover:bg-secondary/50"
                          }`}
                        >
                          <div className="flex items-start gap-4 p-4 md:p-5">
                            <div
                              className={`shrink-0 w-9 h-9 rounded-xl grid place-items-center font-semibold text-sm transition-all ${
                                selected
                                  ? "gradient-brand text-white"
                                  : "bg-background/80 text-muted-foreground ring-1 ring-border/70 group-hover:text-foreground"
                              }`}
                            >
                              {key}
                            </div>
                            <span
                              className={`flex-1 pt-1.5 text-[15px] leading-relaxed ${
                                selected ? "text-foreground" : "text-foreground/85"
                              }`}
                            >
                              {value}
                            </span>
                            <span className="hidden md:inline-flex shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground/60 mt-2">
                              key {idx + 1}
                            </span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between mt-6 pt-5 border-t border-border/60">
                    <Button
                      type="button"
                      onClick={() => toggleMark(question.id)}
                      variant="outline"
                      size="sm"
                      className={`rounded-full gap-2 ${
                        isMarked
                          ? "border-accent/50 text-accent bg-accent/10 hover:bg-accent/15"
                          : "border-border/60 hover:border-accent/50"
                      }`}
                    >
                      {isMarked ? (
                        <BookmarkCheck className="w-4 h-4" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                      {isMarked ? "Marked for review" : "Mark for review"}
                    </Button>
                    <p className="hidden md:block text-[11px] text-muted-foreground">
                      Shortcuts: <kbd className="px-1.5 py-0.5 rounded bg-secondary text-foreground">1–4</kbd>{" "}
                      pick · <kbd className="px-1.5 py-0.5 rounded bg-secondary text-foreground">N</kbd> next ·{" "}
                      <kbd className="px-1.5 py-0.5 rounded bg-secondary text-foreground">P</kbd> prev ·{" "}
                      <kbd className="px-1.5 py-0.5 rounded bg-secondary text-foreground">M</kbd> mark
                    </p>
                  </div>
                </Card>

                {/* Nav */}
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    onClick={goPrev}
                    disabled={currentQuestionIdx === 0}
                    variant="outline"
                    className="rounded-full border-border/60 gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </Button>

                  {currentQuestionIdx === total - 1 ? (
                    <Button
                      type="button"
                      onClick={() => setShowConfirm(true)}
                      className="flex-1 rounded-full gradient-brand text-white gap-2 hover:opacity-90"
                    >
                      Submit test <Flag className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={goNext}
                      className="flex-1 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Question palette (desktop) */}
        <aside className="hidden lg:block w-72 shrink-0 border-l border-border/60 bg-card/40 backdrop-blur-xl">
          <div className="sticky top-[64px] p-5 max-h-[calc(100vh-64px)] overflow-auto">
            <h3 className="text-xs uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-3">
              Questions
            </h3>
            <div className="text-xs text-muted-foreground mb-4">
              <span className="text-foreground font-semibold">{answeredCount}</span> of {total} answered
            </div>
            <PaletteGrid
              total={total}
              current={currentQuestionIdx}
              attempt={currentAttempt}
              questions={test.questions}
              onPick={(i) => setCurrentQuestionIdx(i)}
            />
            <Legend />
          </div>
        </aside>
      </div>

      {/* Mobile palette sheet */}
      <AnimatePresence>
        {paletteOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden"
          >
            <div
              className="absolute inset-0 bg-background/70 backdrop-blur-sm"
              onClick={() => setPaletteOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="absolute inset-x-0 bottom-0 glass-strong rounded-t-3xl p-5 max-h-[80vh] overflow-auto"
            >
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />
              <h3 className="text-sm font-semibold text-foreground mb-3">Questions</h3>
              <PaletteGrid
                total={total}
                current={currentQuestionIdx}
                attempt={currentAttempt}
                questions={test.questions}
                onPick={(i) => {
                  setCurrentQuestionIdx(i);
                  setPaletteOpen(false);
                }}
              />
              <Legend />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm submit */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="glass-strong rounded-2xl border-border/60">
          <AlertDialogTitle className="text-foreground text-xl">
            Submit your test?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            You&apos;ve answered{" "}
            <span className="text-foreground font-semibold">{answeredCount}</span> of{" "}
            <span className="text-foreground font-semibold">{total}</span> questions.
            {answeredCount < total && (
              <>
                {" "}There {total - answeredCount === 1 ? "is" : "are"}{" "}
                <span className="text-warning font-semibold">{total - answeredCount}</span>{" "}
                unanswered. You&apos;ll be able to review every question afterwards.
              </>
            )}
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end mt-4">
            <AlertDialogCancel className="rounded-full border-border/60">
              Keep going
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              className="rounded-full gradient-brand text-white gap-2 hover:opacity-90"
            >
              Submit now <ArrowRight className="w-4 h-4" />
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PaletteGrid({
  total,
  current,
  attempt,
  questions,
  onPick,
}: {
  total: number;
  current: number;
  attempt: NonNullable<ReturnType<typeof useAppStore.getState>["currentAttempt"]>;
  questions: { id: number }[];
  onPick: (i: number) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-2 mb-5">
      {Array.from({ length: total }).map((_, idx) => {
        const q = questions[idx];
        const answered = attempt.answers[q.id] !== null;
        const isCurrent = idx === current;
        const isReviewMarked = attempt.markedForReview.has(q.id);
        return (
          <motion.button
            type="button"
            key={q.id}
            onClick={() => onPick(idx)}
            whileTap={{ scale: 0.9 }}
            className={`aspect-square rounded-lg text-xs font-semibold transition-all ring-focus relative ${
              isCurrent
                ? "gradient-brand text-white shadow-[0_8px_22px_-8px_hsl(var(--primary)/0.7)]"
                : isReviewMarked
                ? "bg-accent/15 text-accent ring-1 ring-accent/40 hover:bg-accent/20"
                : answered
                ? "bg-success/15 text-success ring-1 ring-success/40 hover:bg-success/20"
                : "bg-secondary/40 text-muted-foreground ring-1 ring-border/60 hover:text-foreground hover:bg-secondary/60"
            }`}
          >
            {idx + 1}
            {isReviewMarked && !isCurrent && (
              <span className="absolute top-0.5 right-1 w-1.5 h-1.5 rounded-full bg-accent" />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

function Legend() {
  const items = [
    { label: "Current", swatch: "gradient-brand" },
    { label: "Answered", swatch: "bg-success" },
    { label: "Marked", swatch: "bg-accent" },
    { label: "Untouched", swatch: "bg-muted" },
  ];
  return (
    <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-xs text-muted-foreground">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded ${it.swatch}`} />
          {it.label}
        </div>
      ))}
    </div>
  );
}
