"use client";

import SectionStep from "./PracticeWizard/SectionsStep";
import DifficultyStep from "./PracticeWizard/DifficultyStep";
import ScopeStep from "./PracticeWizard/ScopeStep";
import ReviewStep from "./PracticeWizard/ReviewStep";
import { Layers, Gauge, Hash, Check, Upload, Sparkles, ArrowLeft, ArrowRight, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { Question, Difficulty } from "@/types";
import { useAppStore } from "@/store/useAppStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STEPS = [
  { key: "sections", label: "Sections", icon: Layers },
  { key: "difficulty", label: "Difficulty", icon: Gauge },
  { key: "scope", label: "Count & time", icon: Hash },
  { key: "review", label: "Review", icon: Check },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

export function PracticeWizard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const testBanks = useAppStore((s) => s.testBanks);
  const startPracticeSession = useAppStore((s) => s.startPracticeSession);
  const paperFilters = useAppStore((s) => s.paperFilters);

  // Aggregate the global pool from all real (non-pooled) banks.
  const pool = useMemo(() => {
    const banks = testBanks.filter((b) => !b.id.startsWith("pooled_"));
    return banks.flatMap((b) => b.questions);
  }, [testBanks]);

  const sectionCounts = useMemo(() => {
    const map: Record<string, number> = {};
    pool.forEach((q) => {
      map[q.section] = (map[q.section] || 0) + 1;
    });
    return map;
  }, [pool]);

  const allSections = useMemo(
    () => Object.keys(sectionCounts).sort((a, b) => sectionCounts[b] - sectionCounts[a]),
    [sectionCounts],
  );

  const [step, setStep] = useState<StepKey>("sections");
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<Difficulty[]>([
    "easy",
    "medium",
    "hard",
  ]);
  const [questionCount, setQuestionCount] = useState<number | "all">(20);
  const [duration, setDuration] = useState(30);
  const [shuffleQ, setShuffleQ] = useState(true);
  const [shuffleOpts, setShuffleOpts] = useState(false);
  const [selectedFilterId, setSelectedFilterId] = useState("");
  const [sessionName, setSessionName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const selectedPreset = useMemo(
    () => paperFilters.find((preset) => preset.id === selectedFilterId) ?? null,
    [paperFilters, selectedFilterId],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // Default to all sections selected the first time the pool resolves.
  useEffect(() => {
    if (selectedSections.length === 0 && allSections.length > 0) {
      setSelectedSections(allSections);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSections.length]);

  // Questions matching section filter (used to compute live difficulty counts).
  const sectionFilteredPool = useMemo(() => {
    if (selectedSections.length === 0) return [];
    return pool.filter((q) => selectedSections.includes(q.section));
  }, [pool, selectedSections]);

  const difficultyCounts = useMemo(() => {
    const counts: Record<Difficulty, number> = { easy: 0, medium: 0, hard: 0 };
    sectionFilteredPool.forEach((q) => {
      if (q.difficulty in counts) counts[q.difficulty as Difficulty]++;
    });
    return counts;
  }, [sectionFilteredPool]);

  const matchingPool: Question[] = useMemo(() => {
    if (sectionFilteredPool.length === 0) return [];
    if (selectedDifficulties.length === 0) return [];
    return sectionFilteredPool.filter((q) => selectedDifficulties.includes(q.difficulty));
  }, [sectionFilteredPool, selectedDifficulties]);

  useEffect(() => {
    if (!nameTouched) {
      setSessionName(buildSessionName(selectedSections, selectedDifficulties));
    }
  }, [selectedSections, selectedDifficulties, nameTouched]);

  // Keep questionCount valid as filters change.
  useEffect(() => {
    if (questionCount !== "all" && questionCount > matchingPool.length) {
      setQuestionCount(matchingPool.length > 0 ? matchingPool.length : "all");
    }
  }, [matchingPool.length, questionCount]);

  // Suggest a reasonable duration when count changes (1 min per question, 5 min floor, 180 ceiling).
  useEffect(() => {
    const effectiveCount = questionCount === "all" ? matchingPool.length : questionCount;
    if (effectiveCount > 0) {
      const suggested = Math.max(5, Math.min(180, effectiveCount));
      setDuration((d) => (d === 30 ? suggested : d));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionCount, matchingPool.length]);

  if (!mounted) {
    return <div className="h-96 skeleton-shimmer rounded-2xl" />;
  }

  // Empty pool — push user to import.
  if (pool.length === 0) {
    return (
      <Card className="glass w-full rounded-2xl border-border/60 p-8">
        <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl gradient-brand opacity-90">
          <Upload className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Nothing to practice yet</h3>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Import a question file first and it will land in your pool. Then return here to build a session.
        </p>
        <Button
          onClick={() => router.push("/settings")}
          className="rounded-full mt-5 bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
        >
          <Upload className="w-4 h-4" /> Import questions
        </Button>
      </Card>
    );
  }

  const effectiveCount =
    questionCount === "all" ? matchingPool.length : Math.min(questionCount, matchingPool.length);

  const currentStepIdx = STEPS.findIndex((s) => s.key === step);

  const canAdvance: Record<StepKey, boolean> = {
    sections: selectedSections.length > 0,
    difficulty: selectedDifficulties.length > 0 && matchingPool.length > 0,
    scope: effectiveCount > 0 && duration > 0,
    review: effectiveCount > 0,
  };

  const goNext = () => {
    if (currentStepIdx < STEPS.length - 1) setStep(STEPS[currentStepIdx + 1].key);
  };
  const goBack = () => {
    if (currentStepIdx > 0) setStep(STEPS[currentStepIdx - 1].key);
  };

  const resetWizard = () => {
    setStep("sections");
    setSelectedSections([]);
    setSelectedDifficulties(["easy", "medium", "hard"]);
    setQuestionCount(20);
    setDuration(30);
    setShuffleQ(true);
    setShuffleOpts(false);
    setSelectedFilterId("");
    setSessionName("");
    setNameTouched(false);
  };

  const applyPreset = (filterId: string) => {
    const preset = paperFilters.find((f) => f.id === filterId);
    if (!preset) return;
    const validSections = preset.sections.filter((section) => allSections.includes(section));
    const validDifficulties = preset.difficulties.filter((d) =>
      (["easy", "medium", "hard"] as Difficulty[]).includes(d),
    );

    setSelectedSections(validSections.length > 0 ? validSections : allSections);
    setSelectedDifficulties(
      validDifficulties.length > 0 ? validDifficulties : ["easy", "medium", "hard"],
    );
    setQuestionCount(preset.questionCount);
    setDuration(preset.duration);
    setSessionName(preset.name);
    setNameTouched(true);
    setStep("review");
  };

  const handleStart = () => {
    if (submitting) return;
    setSubmitting(true);
    const effectiveCount =
      questionCount === "all" ? matchingPool.length : Math.min(questionCount, matchingPool.length);
    const name = sessionName.trim() || buildSessionName(selectedSections, selectedDifficulties);
    const sessionId = startPracticeSession({
      name,
      sections: selectedSections,
      difficulties: selectedDifficulties,
      count: effectiveCount,
      duration,
      shuffleQuestions: shuffleQ,
      shuffleOptions: shuffleOpts,
    });
    if (sessionId) {
      router.push(`/test/${sessionId}`);
    }
    setSubmitting(false);
  };


  return (
    <div className="w-full space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs text-muted-foreground mb-3">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          Build a practice session
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          What do you want to <span className="gradient-text">practice today</span>?
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm md:text-base">
          Four quick choices and you're in.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="rounded-xl border border-border/60 bg-secondary/30 p-3">
            <p className="mb-2 text-xs font-semibold text-foreground">Saved paper filter</p>
            <select
              value={selectedFilterId}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedFilterId(id);
                if (id) applyPreset(id);
              }}
              className="h-9 w-full rounded-md border border-border/70 bg-background px-3 text-sm text-foreground"
            >
              <option value="">Select a saved filter</option>
              {paperFilters.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
          </div>
          {!selectedPreset ? (
            <div className="rounded-xl border border-border/60 bg-secondary/30 p-3">
              <p className="mb-2 text-xs font-semibold text-foreground">Paper name</p>
              <Input
                value={sessionName}
                onChange={(e) => {
                  setSessionName(e.target.value);
                  setNameTouched(true);
                }}
                placeholder="Enter paper name"
                className="h-9 bg-background border-border/70"
              />
            </div>
          ) : (
            <div className="rounded-xl border border-border/60 bg-secondary/30 p-3">
              <p className="mb-2 text-xs font-semibold text-foreground">Selected paper</p>
              <p className="text-sm font-semibold text-foreground">{selectedPreset.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {selectedPreset.sections.length} sections • {selectedPreset.difficulties.join("/")} •{" "}
                {selectedPreset.questionCount === "all" ? "all questions" : `${selectedPreset.questionCount} questions`} •{" "}
                {selectedPreset.duration} min
              </p>
            </div>
          )}
        </div>
        {selectedPreset && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              onClick={handleStart}
              disabled={submitting || effectiveCount === 0}
            >
              <Play className="w-4 h-4" /> {submitting ? "Starting..." : "Start Saved Paper"}
            </Button>
            <Button variant="outline" className="rounded-full" onClick={() => setSelectedFilterId("")}>
              Customize instead
            </Button>
          </div>
        )}
      </motion.section>

      {!selectedPreset && (
      <>
      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
        >
          {step === "sections" && (
            <SectionStep
              allSections={allSections}
              sectionCounts={sectionCounts}
              selectedSections={selectedSections}
              onChange={setSelectedSections}
            />
          )}

          {step === "difficulty" && (
            <DifficultyStep
              counts={difficultyCounts}
              selected={selectedDifficulties}
              onChange={setSelectedDifficulties}
            />
          )}

          {step === "scope" && (
            <ScopeStep
              poolSize={matchingPool.length}
              questionCount={questionCount}
              setQuestionCount={setQuestionCount}
              duration={duration}
              setDuration={setDuration}
              shuffleQ={shuffleQ}
              setShuffleQ={setShuffleQ}
              shuffleOpts={shuffleOpts}
              setShuffleOpts={setShuffleOpts}
            />
          )}

          {step === "review" && (
            <ReviewStep
              sections={selectedSections}
              difficulties={selectedDifficulties}
              count={effectiveCount}
              duration={duration}
              shuffleQ={shuffleQ}
              shuffleOpts={shuffleOpts}
              totalPool={pool.length}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Footer nav */}
      <div className="flex items-center justify-between gap-3 sticky bottom-4">
          {step !== "sections" && (
            <Button
              variant="outline"
              className="rounded-full bg-secondary hover:bg-secondary/90 text-foreground gap-2"
              onClick={resetWizard}
            >
              Reset
            </Button>
          )}
          <Button
            variant="outline"
            className="rounded-full border-border/60 gap-2 disabled:opacity-50"
            onClick={goBack}
            disabled={currentStepIdx === 0}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        <div className="text-xs text-muted-foreground hidden sm:block">
          Step {currentStepIdx + 1} of {STEPS.length}
        </div>
        {step !== "review" ? (
          <Button
            className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2 disabled:opacity-50"
            onClick={goNext}
            disabled={!canAdvance[step]}
          >
            Next <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            className="rounded-full gradient-brand text-white gap-2 hover:opacity-90 disabled:opacity-50"
            onClick={handleStart}
            disabled={submitting || effectiveCount === 0}
          >
            <Play className="w-4 h-4" /> {submitting ? "Starting…" : `Start ${effectiveCount} Qs`}
          </Button>
        )}
      </div>
      </>
      )}
    </div>
  );
}



function buildSessionName(sections: string[], difficulties: Difficulty[]): string {
  const sectionPart =
    sections.length === 0
      ? "Mixed sections"
      : sections.length === 1
      ? sections[0]
      : sections.length <= 3
      ? sections.join(" + ")
      : `${sections.slice(0, 2).join(", ")} +${sections.length - 2}`;
  const diffPart =
    difficulties.length === 3 ? "" : difficulties.length === 0 ? "" : ` · ${difficulties.join("/")}`;
  return `${sectionPart}${diffPart}`;
}
