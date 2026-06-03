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
  Shuffle,
  Hash,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import type { Difficulty } from "@/types";

const OPT_KEYS = ["A", "B", "C", "D"] as const;
type OptKey = (typeof OPT_KEYS)[number];

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function ProgressRing({
  value,
  size = 36,
  stroke = 3,
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
        stroke="rgba(0, 0, 0, 0.06)"
        strokeWidth={stroke}
        fill="none"
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="#0F172A"
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        animate={{ strokeDashoffset: c * (1 - value / 100) }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
      />
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
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<Difficulty[]>([
    "easy",
    "medium",
    "hard",
  ]);
  const [questionCount, setQuestionCount] = useState<number | "all">("all");
  const [customDuration, setCustomDuration] = useState<number | null>(null);
  const [shuffleQ, setShuffleQ] = useState(true);
  const [shuffleOpts, setShuffleOpts] = useState(false);
  const [orderMode, setOrderMode] = useState<"latest" | "earliest" | "random">("latest");

  // Persist user preference for order mode
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cil-default-order-mode");
      if (saved === "latest" || saved === "earliest" || saved === "random") {
        setOrderMode(saved);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("cil-default-order-mode", orderMode);
    } catch (e) {
      // ignore
    }
  }, [orderMode]);

  const currentAttempt = useAppStore((s) => s.currentAttempt);
  const getCurrentTest = useAppStore((s) => s.getCurrentTest);
  const testBank = useAppStore((s) => s.testBanks.find((t) => t.id === testId));
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

  useEffect(() => {
    if (testBank) {
      setSelectedSections(Array.from(new Set(testBank.questions.map((q) => q.section))));
      setCustomDuration(testBank.duration);
    }
  }, [testBank]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const test = getCurrentTest();
  const question = test?.questions[currentQuestionIdx];
  const currentAnswer = (question && currentAttempt?.answers[question.id]) || null;
  const hasActiveAttempt = currentAttempt?.testId === testId;

  useEffect(() => {
    if (hasActiveAttempt) {
      setCurrentQuestionIdx(0);
    }
  }, [hasActiveAttempt]);

  const availableSections = useMemo(
    () => (testBank ? Array.from(new Set(testBank.questions.map((q) => q.section))) : []),
    [testBank],
  );
  const availableDifficulties = ["easy", "medium", "hard"] as const;
  const selectedQuestionCount = useMemo(() => {
    if (!testBank) return 0;
    const sectionFilter = selectedSections.length ? selectedSections : availableSections;
    const difficultyFilter = selectedDifficulties.length ? selectedDifficulties : Array.from(availableDifficulties);
    return testBank.questions.filter(
      (q) => sectionFilter.includes(q.section) && difficultyFilter.includes(q.difficulty),
    ).length;
  }, [testBank, selectedSections, selectedDifficulties, availableSections]);
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

  if (!mounted || !isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary/25 border-t-primary animate-spin" />
          <p className="text-xs text-muted-foreground">Loading test workspace…</p>
        </div>
      </div>
    );
  }

  if (!testBank) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center max-w-sm p-6 bg-card rounded-xl border border-border">
          <p className="text-base font-semibold text-foreground">Test not found</p>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            The assessment set you are attempting to configure does not exist or has been removed.
          </p>
          <Button onClick={() => router.push("/")} className="mt-4 rounded-lg text-xs">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!hasActiveAttempt) {
    const effectiveCount =
      questionCount === "all"
        ? selectedQuestionCount
        : Math.min(questionCount, selectedQuestionCount);
    const effectiveDuration = customDuration ?? testBank.duration;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
        <Card className="max-w-2xl w-full rounded-xl p-6 md:p-8 border border-border/80 bg-card shadow-xs">
          <div className="mb-6">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/90 font-bold font-mono">
              Setup Session
            </p>
            <h1 className="mt-2 text-xl font-bold tracking-tight text-foreground">
              Configure practice session
            </h1>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              Tailor your environment by selecting sections, specifying difficulty level splits, question density, and duration overrides.
            </p>
          </div>

          <div className="grid gap-5">
            <div>
              <h2 className="text-xs font-semibold text-foreground mb-2.5">Sections</h2>
              <div className="flex flex-wrap gap-2">
                {availableSections.map((section) => {
                  const selected = selectedSections.includes(section);
                  return (
                    <button
                      key={section}
                      type="button"
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-150 cursor-pointer ${
                        selected 
                          ? "bg-primary text-primary-foreground border-transparent" 
                          : "bg-secondary/70 hover:bg-secondary text-muted-foreground hover:text-foreground border-border/40"
                      }`}
                      onClick={() => {
                        setSelectedSections((current) =>
                          current.includes(section)
                            ? current.filter((item) => item !== section)
                            : [...current, section],
                        );
                      }}
                    >
                      {section}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h2 className="text-xs font-semibold text-foreground mb-2.5">Difficulties</h2>
              <div className="flex flex-wrap gap-2">
                {availableDifficulties.map((difficulty) => {
                  const selected = selectedDifficulties.includes(difficulty);
                  return (
                    <button
                      key={difficulty}
                      type="button"
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-150 cursor-pointer ${
                        selected 
                          ? "bg-primary text-primary-foreground border-transparent" 
                          : "bg-secondary/70 hover:bg-secondary text-muted-foreground hover:text-foreground border-border/40"
                      }`}
                      onClick={() => {
                        setSelectedDifficulties((current) =>
                          current.includes(difficulty)
                            ? current.filter((item) => item !== difficulty)
                            : [...current, difficulty],
                        );
                      }}
                    >
                      {difficulty.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border/60 bg-secondary/30 p-4 flex flex-col justify-between">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-2.5">
                  <Hash className="w-3.5 h-3.5 text-muted-foreground" /> Count limits
                </Label>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  <Button
                    type="button"
                    size="sm"
                    variant={questionCount === "all" ? "default" : "outline"}
                    className="rounded-lg h-7 px-2.5 text-[11px] cursor-pointer"
                    onClick={() => setQuestionCount("all")}
                  >
                    All
                  </Button>
                  {[10, 20, 30, 50].map((n) => (
                    <Button
                      key={n}
                      type="button"
                      size="sm"
                      variant={questionCount === n ? "default" : "outline"}
                      className="rounded-lg h-7 px-2.5 text-[11px] cursor-pointer"
                      onClick={() => setQuestionCount(n)}
                      disabled={n > selectedQuestionCount}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
                <Input
                  type="number"
                  min={1}
                  max={selectedQuestionCount || 1}
                  value={questionCount === "all" ? "" : questionCount}
                  placeholder="Custom quantity"
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10);
                    if (Number.isNaN(n)) setQuestionCount("all");
                    else setQuestionCount(Math.max(1, Math.min(selectedQuestionCount, n)));
                  }}
                  className="h-8 bg-card border-border/80 text-xs px-2.5 rounded-lg"
                />
                <p className="text-[10px] text-muted-foreground/80 mt-2">
                  Pool: {selectedQuestionCount} matching · using {effectiveCount}
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-secondary/30 p-4 flex flex-col justify-between">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-2.5">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" /> Time override
                </Label>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {[15, 30, 45, 60].map((m) => (
                    <Button
                      key={m}
                      type="button"
                      size="sm"
                      variant={customDuration === m ? "default" : "outline"}
                      className="rounded-lg h-7 px-2.5 text-[11px] cursor-pointer"
                      onClick={() => setCustomDuration(m)}
                    >
                      {m}m
                    </Button>
                  ))}
                </div>
                <Input
                  type="number"
                  min={1}
                  max={999}
                  value={customDuration ?? ""}
                  placeholder="Custom minutes"
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10);
                    setCustomDuration(Number.isNaN(n) ? null : Math.max(1, n));
                  }}
                  className="h-8 bg-card border-border/80 text-xs px-2.5 rounded-lg"
                />
                <p className="text-[10px] text-muted-foreground/80 mt-2">
                  Bank default: {testBank.duration} min
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-secondary/30 p-3.5 flex flex-wrap gap-3 items-center justify-between">
              <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Shuffle className="w-3.5 h-3.5 text-muted-foreground" /> Randomization
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShuffleQ((v) => !v)}
                  className={`text-[11px] font-medium px-2.5 py-1.5 rounded-lg border transition-all duration-150 cursor-pointer ${
                    shuffleQ 
                      ? "bg-primary text-primary-foreground border-transparent shadow-2xs" 
                      : "bg-card text-muted-foreground hover:text-foreground border-border/80"
                  }`}
                >
                  Shuffle Qs
                </button>
                <button
                  type="button"
                  onClick={() => setShuffleOpts((v) => !v)}
                  className={`text-[11px] font-medium px-2.5 py-1.5 rounded-lg border transition-all duration-150 cursor-pointer ${
                    shuffleOpts 
                      ? "bg-primary text-primary-foreground border-transparent shadow-2xs" 
                      : "bg-card text-muted-foreground hover:text-foreground border-border/80"
                  }`}
                >
                  Shuffle Options
                </button>
                <div className="flex items-center gap-2 ml-2">
                  <div className="text-xs text-muted-foreground/90 mr-1">Order:</div>
                  <Select value={orderMode} onValueChange={(v) => setOrderMode(v as any)}>
                    <SelectTrigger className="h-8 w-36" size="sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="latest">Latest</SelectItem>
                      <SelectItem value="earliest">Earliest</SelectItem>
                      <SelectItem value="random">Random</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border/70 bg-secondary/50 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground/90 font-mono">Summary</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">
                    {effectiveCount} question{effectiveCount === 1 ? "" : "s"} · {effectiveDuration} min
                  </p>
                </div>
                <div className="text-[10px] text-muted-foreground/95 bg-card border border-border/40 px-2 py-0.5 rounded-md">
                  {selectedSections.length === 0 && selectedDifficulties.length === 0
                    ? "Full set pool selected"
                    : `${selectedSections.length || "All"} sections · ${selectedDifficulties.length || "All"} difficulty levels`}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
              <Button
                onClick={() => {
                  setSelectedSections(availableSections);
                  setSelectedDifficulties(["easy", "medium", "hard"]);
                  setQuestionCount("all");
                  setCustomDuration(testBank.duration);
                  setShuffleQ(true);
                  setShuffleOpts(false);
                }}
                variant="outline"
                size="sm"
                className="rounded-lg h-9 text-xs border-border/80 hover:bg-secondary cursor-pointer"
              >
                Reset Setup
              </Button>
              <div className="flex flex-col items-start sm:items-end gap-1 flex-1 sm:max-w-[320px]">
                <Button
                  onClick={() =>
                    startTest(testId, {
                      sections: selectedSections,
                      difficulties: selectedDifficulties,
                      count: questionCount === "all" ? undefined : questionCount,
                      duration: effectiveDuration,
                      shuffleQuestions: shuffleQ,
                          shuffleOptions: shuffleOpts,
                          orderMode,
                    })
                  }
                  className="rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold gap-1.5 h-9 w-full sm:w-auto px-6 cursor-pointer shadow-xs"
                  disabled={effectiveCount === 0}
                >
                  Start Practice Session
                </Button>
                {effectiveCount === 0 && (
                  <p className="text-[10px] text-destructive mt-1">
                    Please adjust filters. No matching questions available.
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!test || !question || !currentAttempt) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary/25 border-t-primary animate-spin" />
          <p className="text-xs text-muted-foreground">Preparing practice environment…</p>
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
    <div className="h-screen overflow-hidden flex flex-col bg-background select-none">
      {/* Sticky Immersive Workspace Header */}
      <header className="h-[60px] border-b border-border/80 bg-card/95 backdrop-blur-md flex items-center shrink-0">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-1.5 bg-primary text-primary-foreground rounded-lg shrink-0 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 leading-tight">
              <p className="text-sm font-semibold text-foreground truncate">
                {test.testName}
              </p>
              <p className="text-[10px] text-muted-foreground/80 font-medium">
                Question {currentQuestionIdx + 1} of {total} ·{" "}
                <span className="text-foreground/90">{answeredCount} answered</span>
                {markedCount > 0 && (
                  <>
                    {" "}· <span className="text-primary font-semibold">{markedCount} marked</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {/* Progress indicator */}
            <div className="hidden md:flex items-center gap-2">
              <ProgressRing value={questionProgress} />
              <div className="text-[10px] leading-tight text-muted-foreground">
                <div className="font-bold text-foreground tabular-nums">{questionProgress}%</div>
                <div>answered</div>
              </div>
            </div>

            {/* Timer */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-bold tabular-nums border transition-all ${
                isTimeCritical
                  ? "text-destructive border-destructive/50 bg-destructive/10 animate-pulse"
                  : isTimeWarning
                  ? "text-warning border-warning/40 bg-warning/5"
                  : "text-foreground border-border/60 bg-secondary/80"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              {formatTime(timeLeft)}
            </div>

            <Button
              onClick={() => setPaletteOpen(true)}
              variant="outline"
              size="sm"
              className="lg:hidden rounded-lg border-border/80 text-xs px-2.5 h-8 cursor-pointer hover:bg-secondary"
            >
              Palette
            </Button>

            <Button
              onClick={() => setShowConfirm(true)}
              size="sm"
              className="rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground gap-1 px-3.5 h-8 text-xs font-semibold shadow-2xs cursor-pointer"
            >
              <Flag className="w-3 h-3" /> Submit
            </Button>
          </div>
        </div>
      </header>

      {/* Progress timeline bar */}
      <div className="h-[2px] bg-border/25 relative overflow-hidden shrink-0">
        <motion.div
          className={`h-full ${
            isTimeCritical ? "bg-destructive" : isTimeWarning ? "bg-warning" : "bg-primary"
          }`}
          style={{ width: `${timeProgress}%` }}
          transition={{ ease: "linear" }}
        />
      </div>

      {/* Main Workspace Frame */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Centered Question Assessment Desk */}
        <main className="flex-1 min-w-0 flex flex-col h-full bg-background justify-between p-3 md:p-4 overflow-hidden">
          
          {/* Question Card Box */}
          <div className="flex-1 min-h-0 flex items-center justify-center select-text">
            <Card className="bg-card rounded-xl border border-border/80 shadow-2xs p-5 md:p-6 max-w-4xl w-full h-full flex flex-col overflow-hidden">
              
              {/* Question Card Header */}
              <div className="flex items-center flex-wrap gap-2 mb-2 shrink-0 select-none">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] uppercase tracking-[0.14em] font-semibold bg-secondary text-secondary-foreground border border-border/30">
                  {question.section}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] uppercase tracking-[0.14em] font-semibold border ${
                    question.difficulty === "easy"
                      ? "bg-success/10 text-success border-success/20"
                      : question.difficulty === "medium"
                      ? "bg-warning/10 text-warning border-warning/20"
                      : "bg-destructive/10 text-destructive border-destructive/20"
                  }`}
                >
                  {question.difficulty}
                </span>
                <span className="text-[10px] text-muted-foreground/80 font-mono ml-auto">
                  Question {currentQuestionIdx + 1} of {total}
                </span>
              </div>

              {/* Question Title */}
              <h2 className="text-base md:text-lg font-semibold leading-snug tracking-tight text-foreground select-none shrink-0 mb-3 pr-1">
                {question.question}
              </h2>

              {/* Choice Options List - internally scrollable ONLY if options overflow */}
              <div className="space-y-2 overflow-y-auto flex-1 pr-2 pb-1 scrollbar-thin">
                {OPT_KEYS.map((key, idx) => {
                  const value = question.options[key];
                  const selected = currentAnswer === key;
                  return (
                    <motion.button
                      key={key}
                      type="button"
                      onClick={() => handleAnswerChange(key)}
                      whileTap={{ scale: 0.995 }}
                      className={`group w-full text-left rounded-lg border transition-all duration-150 ring-focus cursor-pointer ${
                        selected
                          ? "border-primary bg-secondary/90 font-medium shadow-2xs"
                          : "border-border/80 bg-card hover:bg-secondary/40 hover:border-primary/20"
                      }`}
                    >
                      <div className="flex items-start gap-3 p-3">
                        <div
                          className={`shrink-0 w-7 h-7 rounded-lg grid place-items-center font-bold text-xs transition-all border ${
                            selected
                              ? "bg-primary text-primary-foreground border-transparent"
                              : "bg-secondary text-muted-foreground group-hover:text-foreground border-border/40"
                          }`}
                        >
                          {key}
                        </div>
                        <span
                          className={`flex-1 pt-0.5 text-xs md:text-sm leading-relaxed ${
                            selected ? "text-foreground font-semibold" : "text-foreground/90"
                          }`}
                        >
                          {value}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Question Card Footer */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60 shrink-0 select-none">
                <Button
                  type="button"
                  onClick={() => toggleMark(question.id)}
                  variant="outline"
                  size="sm"
                  className={`rounded-lg text-xs h-7 gap-1.5 border-border/80 hover:bg-secondary/50 cursor-pointer text-[11px] px-2 ${
                    isMarked
                      ? "text-primary bg-secondary border-primary/50"
                      : "text-muted-foreground"
                  }`}
                >
                  {isMarked ? (
                    <BookmarkCheck className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <Bookmark className="w-3.5 h-3.5 text-muted-foreground/80" />
                  )}
                  {isMarked ? "Marked" : "Mark"}
                </Button>
                <p className="hidden lg:block text-[9px] text-muted-foreground/75 font-mono">
                  <kbd className="px-1 py-0.5 rounded bg-secondary text-foreground border border-border/30 text-[8px]">1–4</kbd>
                  <kbd className="px-1 py-0.5 rounded bg-secondary text-foreground border border-border/30 text-[8px] ml-1">N</kbd>
                  <kbd className="px-1 py-0.5 rounded bg-secondary text-foreground border border-border/30 text-[8px] ml-1">P</kbd>
                </p>
              </div>
            </Card>
          </div>

          {/* Sticky Bottom Action Navigation Bar */}
          <div className="flex items-center gap-2 w-full max-w-4xl mx-auto shrink-0 mt-2 select-none">
            <Button
              type="button"
              onClick={goPrev}
              disabled={currentQuestionIdx === 0}
              variant="outline"
              className="rounded-lg border-border/80 gap-1 px-3 h-8 text-xs cursor-pointer hover:bg-secondary"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </Button>

            {currentQuestionIdx === total - 1 ? (
              <Button
                type="button"
                onClick={() => setShowConfirm(true)}
                className="flex-1 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground gap-1.5 h-8 text-xs font-semibold shadow-xs cursor-pointer"
              >
                Submit <Flag className="w-3 h-3" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={goNext}
                className="flex-1 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground gap-1 h-8 text-xs font-semibold shadow-xs cursor-pointer"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </main>

        {/* Question Palette Drawer (desktop right panel) */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 border-l border-border/80 bg-card overflow-hidden">
          <div className="flex flex-col h-full p-4">
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <div>
                <h3 className="text-xs uppercase tracking-[0.14em] text-muted-foreground/90 font-bold font-mono">
                  Palette
                </h3>
                <div className="text-[10px] text-muted-foreground/80 mt-1">
                  <span className="text-foreground font-semibold">{answeredCount}</span> of {total}
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto pr-2 mt-3">
                <PaletteGrid
                  total={total}
                  current={currentQuestionIdx}
                  attempt={currentAttempt}
                  questions={test.questions}
                  onPick={(i) => setCurrentQuestionIdx(i)}
                />
              </div>
            </div>
            <div className="border-t border-border/60 pt-3 mt-3 shrink-0">
              <Legend />
            </div>
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
              className="absolute inset-0 bg-background/60 backdrop-blur-xs"
              onClick={() => setPaletteOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 260 }}
              className="absolute inset-x-0 bottom-0 bg-card rounded-t-2xl p-4 border-t border-border shadow-2xl max-h-[80vh] flex flex-col overflow-hidden"
            >
              <div className="w-10 h-1 bg-secondary rounded-full mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-foreground mb-3">Questions</h3>
              <div className="flex-1 min-h-0 overflow-y-auto pr-2">
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
              </div>
              <div className="border-t border-border/60 pt-3 mt-3 shrink-0">
                <Legend />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm submit */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="bg-card rounded-xl border border-border/80 max-w-sm p-6 shadow-xl">
          <AlertDialogTitle className="text-foreground text-lg font-bold">
            Submit your test?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground text-xs leading-relaxed mt-2">
            You have answered <span className="text-foreground font-semibold">{answeredCount}</span> of <span className="text-foreground font-semibold">{total}</span> questions.
            {answeredCount < total && (
              <>
                {" "}There are <span className="text-warning font-semibold">{total - answeredCount}</span> questions remaining unanswered.
              </>
            )}
            {" "}Are you sure you want to finalize this attempt?
          </AlertDialogDescription>
          <div className="flex gap-2.5 justify-end mt-5">
            <AlertDialogCancel className="rounded-lg text-xs h-8 border-border/80 hover:bg-secondary cursor-pointer">
              Continue Test
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              className="rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground gap-1 px-4 h-8 text-xs font-semibold cursor-pointer shadow-xs"
            >
              Submit Now <ArrowRight className="w-3.5 h-3.5" />
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
    <div className="grid grid-cols-5 gap-2 mb-2">
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
            className={`aspect-square rounded-lg text-xs font-semibold transition-all relative ring-focus border cursor-pointer ${
              isCurrent
                ? "bg-primary text-primary-foreground border-transparent shadow-xs font-bold"
                : isReviewMarked
                ? "bg-warning/15 text-warning border-warning/30 hover:bg-warning/25"
                : answered
                ? "bg-success/15 text-success border-success/30 hover:bg-success/25"
                : "bg-secondary/45 text-muted-foreground border-border/60 hover:text-foreground hover:bg-secondary/80"
            }`}
          >
            {idx + 1}
            {isReviewMarked && !isCurrent && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-warning" />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

function Legend() {
  const items = [
    { label: "Current", swatch: "bg-primary" },
    { label: "Answered", swatch: "bg-success/80" },
    { label: "Marked", swatch: "bg-warning/80" },
    { label: "Untouched", swatch: "bg-secondary" },
  ];
  return (
    <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-[10px] text-muted-foreground/90 font-medium">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded-md ${it.swatch} border border-border/40 shrink-0`} />
          {it.label}
        </div>
      ))}
    </div>
  );
}
