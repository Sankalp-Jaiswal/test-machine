// hooks/usePracticeWizard.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import type { Difficulty, Question } from "@/types";

export type StepKey = "sections" | "difficulty" | "scope" | "review";

export const STEPS = [
  { key: "sections" as StepKey, label: "Sections", icon: "Layers" },
  { key: "difficulty" as StepKey, label: "Difficulty", icon: "Gauge" },
  { key: "scope" as StepKey, label: "Count & time", icon: "Hash" },
  { key: "review" as StepKey, label: "Review", icon: "Check" },
] as const;

export function usePracticeWizard() {
  const router = useRouter();
  const testBanks = useAppStore((s) => s.testBanks);
  const startPracticeSession = useAppStore((s) => s.startPracticeSession);

  // Pool aggregation
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
    [sectionCounts]
  );

  const [step, setStep] = useState<StepKey>("sections");
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<Difficulty[]>(["easy", "medium", "hard"]);
  const [questionCount, setQuestionCount] = useState<number | "all">(20);
  const [duration, setDuration] = useState(30);
  const [shuffleQ, setShuffleQ] = useState(true);
  const [shuffleOpts, setShuffleOpts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Default to all sections on first load
  useEffect(() => {
    if (selectedSections.length === 0 && allSections.length > 0) {
      setSelectedSections(allSections);
    }
  }, [allSections.length]);

  // Filtered pools
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

  // Keep questionCount valid
  useEffect(() => {
    if (questionCount !== "all" && questionCount > matchingPool.length) {
      setQuestionCount(matchingPool.length > 0 ? matchingPool.length : "all");
    }
  }, [matchingPool.length, questionCount]);

  // Suggest duration based on count
  useEffect(() => {
    const effectiveCount = questionCount === "all" ? matchingPool.length : questionCount;
    if (effectiveCount > 0) {
      const suggested = Math.max(5, Math.min(180, effectiveCount));
      setDuration((d) => (d === 30 ? suggested : d));
    }
  }, [questionCount, matchingPool.length]);

  const effectiveCount =
    questionCount === "all" ? matchingPool.length : Math.min(questionCount as number, matchingPool.length);

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

  const reset = () => {
    setStep("sections");
    setSelectedSections([]);
    setSelectedDifficulties(["easy", "medium", "hard"]);
    setQuestionCount(20);
    setDuration(30);
    setShuffleQ(true);
    setShuffleOpts(false);
  };

  // Submit handler (kept here for later integration)
  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const sessionId = startPracticeSession({
        name: "Practice Session",
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
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return {
    mounted,
    setMounted,
    step,
    setStep,
    selectedSections,
    setSelectedSections,
    selectedDifficulties,
    setSelectedDifficulties,
    questionCount,
    setQuestionCount,
    duration,
    setDuration,
    shuffleQ,
    setShuffleQ,
    shuffleOpts,
    setShuffleOpts,
    submitting,
    setSubmitting,
    pool,
    allSections,
    sectionCounts,
    difficultyCounts,
    matchingPool,
    effectiveCount,
    currentStepIdx,
    canAdvance,
    goNext,
    goBack,
    reset,
    submit,
  };
}
