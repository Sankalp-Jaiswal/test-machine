import { create } from "zustand";
import {
  TestBank,
  TestAttempt,
  TestResult,
  QuestionAttempt,
  Question,
  Difficulty,
  PaperFilterPreset,
} from "@/types";
import { DEMO_TESTS } from "@/lib/demoData";
import { normalizeSection } from "@/lib/sectionNormalizer";

type StartTestOptions = {
  sections?: string[];
  difficulties?: Difficulty[];
  /** Cap the number of questions for this attempt. Falls back to all matching. */
  count?: number;
  /** Override the test bank's default duration (minutes). */
  duration?: number;
  /** Randomize question order. Default true. */
  shuffleQuestions?: boolean;
  /** Randomize options (A/B/C/D) per question, remapping correctAnswer. */
  shuffleOptions?: boolean;
  /** Force an exact question id ordering — used by retry-same-questions. */
  forcedQuestionOrder?: number[];
  /** Pre-built per-question snapshot (used by retry from a saved result). */
  forcedSnapshot?: Question[];
};

interface AppState {
  testBanks: TestBank[];
  testResults: TestResult[];
  paperFilters: PaperFilterPreset[];
  currentAttempt: TestAttempt | null;
  isInitialized: boolean;
  addTestBank: (test: TestBank) => Promise<void>;
  /** Adds a test bank to in-memory state only (e.g. ephemeral pooled mixes). */
  addEphemeralTestBank: (test: TestBank) => void;
  deleteTestBank: (id: string) => Promise<void>;
  startTest: (testId: string, options?: StartTestOptions) => boolean;
  /** Build a pooled ephemeral test from multiple banks, then start it. Returns new test id (or null). */
  startPooledTest: (
    bankIds: string[],
    pooledName: string,
    options?: StartTestOptions,
  ) => string | null;
  /** Re-run an existing attempt with the exact same questions in the same order. */
  retryAttempt: (attemptId: string, options?: { duration?: number }) => string | null;
  /** Pool questions across ALL non-ephemeral banks and start a practice session. */
  startPracticeSession: (config: {
    name: string;
    sections: string[];
    difficulties: Difficulty[];
    count: number;
    duration: number;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
  }) => string | null;
  addPaperFilter: (preset: Omit<PaperFilterPreset, "id" | "createdAt">) => string;
  deletePaperFilter: (id: string) => void;
  /** Aggregate stats across the user's full question pool. */
  getQuestionPoolStats: () => {
    totalQuestions: number;
    totalSections: number;
    totalImports: number;
    bySection: Record<string, number>;
    byDifficulty: Record<"easy" | "medium" | "hard", number>;
  };
  endTest: (answers: Record<number, string | null>, timePerQuestion: Record<number, number>) => Promise<void>;
  updateAnswers: (questionId: number, answer: "A" | "B" | "C" | "D" | null) => void;
  toggleMarkForReview: (questionId: number) => void;
  getCurrentTest: () => TestBank | undefined;
  getTestResults: () => TestResult[];
  getDashboardStats: () => { totalTests: number; avgAccuracy: number; totalTime: number };
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => void;
}

const loadInitialState = () => {
  if (typeof window === "undefined") return { testBanks: DEMO_TESTS, testResults: [] };
  return { testBanks: DEMO_TESTS, testResults: [] };
};

const shuffle = <T,>(items: T[]) => {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const shuffleQuestionOptions = (q: Question): Question => {
  const keys: Array<"A" | "B" | "C" | "D"> = ["A", "B", "C", "D"];
  const order = shuffle(keys);
  const newOptions = {
    A: q.options[order[0]],
    B: q.options[order[1]],
    C: q.options[order[2]],
    D: q.options[order[3]],
  };
  const newCorrect = (["A", "B", "C", "D"] as const)[order.indexOf(q.correctAnswer)];
  return { ...q, options: newOptions, correctAnswer: newCorrect };
};

const normalizeTestBankSections = <T extends TestBank>(test: T): T => ({
  ...test,
  questions: (test.questions || []).map((q) => ({
    ...q,
    section: normalizeSection(q.section),
  })),
});

const normalizeTestBankList = <T extends TestBank>(tests: T[]): T[] => tests.map((test) => normalizeTestBankSections(test));

const buildQuestionOrder = (
  test: TestBank,
  sections: string[],
  difficulties: Difficulty[],
  testResults: TestResult[],
  shuffleEnabled: boolean,
) => {
  const exposureMap: Record<number, number> = {};
  testResults
    .filter((result) => result.testId === test.id)
    .forEach((result) => {
      result.questionAttempts?.forEach((qa) => {
        exposureMap[qa.questionId] = (exposureMap[qa.questionId] || 0) + 1;
      });
    });

  const selected = test.questions.filter(
    (q) =>
      (sections.length === 0 || sections.includes(q.section)) &&
      (difficulties.length === 0 || difficulties.includes(q.difficulty)),
  );

  if (selected.length === 0) {
    if (sections.length === 0 && difficulties.length === 0) {
      return shuffleEnabled ? shuffle(test.questions.map((q) => q.id)) : test.questions.map((q) => q.id);
    }
    return [];
  }

  if (!shuffleEnabled) {
    // Preserve original order, no exposure-prioritization.
    return selected.map((q) => q.id);
  }

  const groups: Record<number, number[]> = {};
  selected.forEach((q) => {
    const count = exposureMap[q.id] || 0;
    groups[count] = groups[count] || [];
    groups[count].push(q.id);
  });

  const sortedExposureLevels = Object.keys(groups)
    .map(Number)
    .sort((a, b) => a - b);

  return sortedExposureLevels.flatMap((level) => shuffle(groups[level]));
};

export const useAppStore = create<AppState>((set, get) => {
  const initial = loadInitialState();

  return {
    testBanks: initial.testBanks,
    testResults: initial.testResults,
    paperFilters: [],
    currentAttempt: null,
    isInitialized: false,

    saveToStorage: () => {
      if (typeof window === "undefined") return;
      try {
        // Skip ephemeral pooled banks (id prefix `pooled_`).
        const persistedBanks = get().testBanks.filter((t) => !t.id.startsWith("pooled_"));
        localStorage.setItem(
          "cil-prep-arena",
          JSON.stringify({
            testBanks: persistedBanks,
            testResults: get().testResults,
            paperFilters: get().paperFilters,
          })
        );
      } catch (e) {
        console.error("Failed to save to storage:", e);
      }
    },

    loadFromStorage: async () => {
      if (typeof window === "undefined") return;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const [banksRes, resultsRes] = await Promise.all([
          fetch(`/api/test-banks`, { signal: controller.signal }).then((r) => (r.ok ? r.json() : { __unauth: r.status === 401 })),
          fetch(`/api/test-results`, { signal: controller.signal }).then((r) => (r.ok ? r.json() : { __unauth: r.status === 401 })),
        ]);

        clearTimeout(timeout);

        const saved = (() => {
          try {
            const s = localStorage.getItem("cil-prep-arena");
            return s ? JSON.parse(s) : null;
          } catch (_) {
            return null;
          }
        })();

        const banksUnauthorized = Boolean(
          banksRes && typeof banksRes === "object" && (banksRes as any).__unauth,
        );
        const resultsUnauthorized = Boolean(
          resultsRes && typeof resultsRes === "object" && (resultsRes as any).__unauth,
        );

        const testBanksRaw = Array.isArray(banksRes) && banksRes.length > 0 ? banksRes : saved?.testBanks || DEMO_TESTS;
        const testBanks = normalizeTestBankList(testBanksRaw);
        const testResults =
          Array.isArray(resultsRes)
            ? resultsRes
            : resultsUnauthorized
            ? saved?.testResults || []
            : saved?.testResults || [];
        const paperFilters = Array.isArray(saved?.paperFilters) ? saved.paperFilters : [];

        // If both are unauthorized, fully fall back to local cache/demo.
        if (banksUnauthorized && resultsUnauthorized) {
          set({
            testBanks: normalizeTestBankList(saved?.testBanks || DEMO_TESTS),
            testResults: saved?.testResults || [],
            paperFilters,
            isInitialized: true,
          });
          return;
        }

        set({ testBanks, testResults, paperFilters, isInitialized: true });
        get().saveToStorage();
      } catch (e) {
        console.error("Failed to load from server, falling back to local cache:", e);
        const saved = (() => {
          try {
            const s = localStorage.getItem("cil-prep-arena");
            return s ? JSON.parse(s) : null;
          } catch (_) {
            return null;
          }
        })();
        set({
          testBanks: normalizeTestBankList(saved?.testBanks || DEMO_TESTS),
          testResults: saved?.testResults || [],
          paperFilters: saved?.paperFilters || [],
          isInitialized: true,
        });
      }
    },

    addTestBank: async (test: TestBank) => {
      const normalizedTest = normalizeTestBankSections(test);
      set((state) => ({ testBanks: [...state.testBanks, normalizedTest] }));
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        await fetch(`/api/test-banks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(normalizedTest),
          signal: controller.signal,
        });

        clearTimeout(timeout);
      } catch (e) {
        console.error("Failed to save test bank to server:", e);
      }
      get().saveToStorage();
    },

    addEphemeralTestBank: (test: TestBank) => {
      const normalizedTest = normalizeTestBankSections(test);
      set((state) => {
        if (state.testBanks.some((t) => t.id === normalizedTest.id)) return state;
        return { testBanks: [...state.testBanks, normalizedTest] };
      });
    },

    deleteTestBank: async (id: string) => {
      set((state) => ({ testBanks: state.testBanks.filter((test) => test.id !== id) }));
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        await fetch(`/api/test-banks/${encodeURIComponent(id)}`, {
          method: "DELETE",
          signal: controller.signal,
        });

        clearTimeout(timeout);
      } catch (e) {
        console.error("Failed to delete test bank on server:", e);
      }
      get().saveToStorage();
    },

    addPaperFilter: (preset) => {
      const id = `filter_${Date.now()}`;
      const next: PaperFilterPreset = {
        ...preset,
        id,
        createdAt: Date.now(),
      };
      set((state) => ({ paperFilters: [next, ...state.paperFilters] }));
      get().saveToStorage();
      return id;
    },

    deletePaperFilter: (id) => {
      set((state) => ({
        paperFilters: state.paperFilters.filter((preset) => preset.id !== id),
      }));
      get().saveToStorage();
    },

    startTest: (testId: string, options?: StartTestOptions) => {
      const testBanks = get().testBanks;
      const test = testBanks.find((t) => t.id === testId);
      if (!test) return false;

      const sections = options?.sections ?? [];
      const difficulties = options?.difficulties ?? [];
      const shuffleQ = options?.shuffleQuestions ?? true;
      const shuffleOpts = options?.shuffleOptions ?? false;
      const duration = options?.duration ?? test.duration;

      let questionOrder: number[];
      let questionsSnapshot: Question[] | undefined;

      if (options?.forcedQuestionOrder && options.forcedQuestionOrder.length > 0) {
        questionOrder = [...options.forcedQuestionOrder];
        if (options.forcedSnapshot && options.forcedSnapshot.length > 0) {
          // Reorder snapshot to match forced order.
          const byId = new Map(options.forcedSnapshot.map((q) => [q.id, q]));
          questionsSnapshot = questionOrder
            .map((qid) => byId.get(qid))
            .filter((q): q is Question => Boolean(q));
        }
      } else {
        questionOrder = buildQuestionOrder(test, sections, difficulties, get().testResults, shuffleQ);
        if (options?.count && options.count > 0) {
          questionOrder = questionOrder.slice(0, options.count);
        }
      }

      if (questionOrder.length === 0) return false;

      if (!questionsSnapshot) {
        const ordered = questionOrder
          .map((qid) => test.questions.find((q) => q.id === qid))
          .filter((q): q is Question => Boolean(q));
        questionsSnapshot = shuffleOpts ? ordered.map(shuffleQuestionOptions) : ordered;
      }

      const attempt: TestAttempt = {
        id: `attempt_${Date.now()}`,
        testId,
        testName: test.testName,
        startedAt: Date.now(),
        duration,
        questionOrder,
        questionsSnapshot,
        answers: Object.fromEntries(questionOrder.map((qId) => [qId, null])),
        markedForReview: new Set(),
        timePerQuestion: Object.fromEntries(questionOrder.map((qId) => [qId, 0])),
        filters: {
          sections,
          difficulties,
          count: options?.count,
          shuffleQuestions: shuffleQ,
          shuffleOptions: shuffleOpts,
        },
      };
      set({ currentAttempt: attempt });
      return true;
    },

    startPooledTest: (bankIds, pooledName, options) => {
      const banks = get().testBanks.filter((t) => bankIds.includes(t.id));
      if (banks.length === 0) return null;

      // Re-key questions so ids stay unique across banks.
      let nextId = 1;
      const pooledQuestions: Question[] = [];
      banks.forEach((bank) => {
        bank.questions.forEach((q) => {
          pooledQuestions.push({ ...q, id: nextId++ });
        });
      });

      const defaultDuration =
        options?.duration ??
        Math.max(
          15,
          Math.round(banks.reduce((sum, b) => sum + b.duration, 0) / banks.length),
        );

      const pooledId = `pooled_${Date.now()}`;
      const pooledBank: TestBank = {
        id: pooledId,
        testName: pooledName || `Custom mix (${banks.length} tests)`,
        duration: defaultDuration,
        questions: pooledQuestions,
        createdAt: Date.now(),
      };

      get().addEphemeralTestBank(pooledBank);

      const ok = get().startTest(pooledId, {
        ...options,
        duration: defaultDuration,
      });
      if (!ok) return null;

      // Tag the attempt with source bank ids for the retry/history view.
      set((state) => {
        if (!state.currentAttempt) return state;
        return {
          currentAttempt: {
            ...state.currentAttempt,
            filters: {
              ...(state.currentAttempt.filters ?? {
                sections: [],
                difficulties: [],
                shuffleQuestions: true,
                shuffleOptions: false,
              }),
              sourceBankIds: bankIds,
            },
          },
        };
      });
      return pooledId;
    },

    retryAttempt: (attemptId, options) => {
      const result = get().testResults.find((r) => r.attemptId === attemptId);
      if (!result) return null;

      const order = result.questionOrder ?? result.questionAttempts?.map((qa) => qa.questionId);
      if (!order || order.length === 0) return null;

      // Reconstruct snapshot from the saved record so we don't depend on the
      // bank still being present (matters for old pooled mixes).
      const snapshot: Question[] =
        result.questionsSnapshot?.length
          ? result.questionsSnapshot
          : (result.questionAttempts ?? []).map((qa) => ({
              id: qa.questionId,
              section: qa.section,
              difficulty: qa.difficulty,
              question: qa.question,
              options: qa.options,
              correctAnswer: qa.correctAnswer,
              explanation: qa.explanation,
            }));

      // If the source bank is gone (likely for pooled mixes), recreate ephemerally.
      const bankExists = get().testBanks.some((t) => t.id === result.testId);
      if (!bankExists) {
        get().addEphemeralTestBank({
          id: result.testId,
          testName: result.testName,
          duration: result.duration ?? 30,
          questions: snapshot,
          createdAt: Date.now(),
        });
      }

      const ok = get().startTest(result.testId, {
        duration: options?.duration ?? result.duration,
        shuffleQuestions: false,
        shuffleOptions: false,
        forcedQuestionOrder: order,
        forcedSnapshot: snapshot,
      });
      return ok ? result.testId : null;
    },

    endTest: async (answers, timePerQuestion) => {
      const attempt = get().currentAttempt;
      if (!attempt) return;

      // Source the question objects from the snapshot first, falling back to bank.
      const snapshot = attempt.questionsSnapshot;
      const test = get().testBanks.find((t) => t.id === attempt.testId);
      const questionById = new Map<number, Question>();
      snapshot?.forEach((q) => questionById.set(q.id, q));
      test?.questions.forEach((q) => {
        if (!questionById.has(q.id)) questionById.set(q.id, q);
      });

      const selectedQuestions: Question[] = attempt.questionOrder
        .map((questionId) => questionById.get(questionId))
        .filter((q): q is Question => Boolean(q));

      if (selectedQuestions.length === 0) return;

      const completedAt = Date.now();
      const timeTaken = Math.round((completedAt - attempt.startedAt) / 1000);

      let correctCount = 0;
      let skippedCount = 0;
      const sectionPerf: Record<string, { correct: number; total: number }> = {};
      const difficultyPerf: Record<string, { correct: number; total: number }> = {};
      const questionAttempts: QuestionAttempt[] = [];

      selectedQuestions.forEach((q) => {
        const userAnswer = answers[q.id] ?? null;
        const isSkipped = userAnswer === null;
        const isCorrect = !isSkipped && userAnswer === q.correctAnswer;
        if (isSkipped) skippedCount++;
        if (isCorrect) correctCount++;

        if (!sectionPerf[q.section]) sectionPerf[q.section] = { correct: 0, total: 0 };
        if (!difficultyPerf[q.difficulty]) difficultyPerf[q.difficulty] = { correct: 0, total: 0 };

        sectionPerf[q.section].total++;
        difficultyPerf[q.difficulty].total++;
        if (isCorrect) {
          sectionPerf[q.section].correct++;
          difficultyPerf[q.difficulty].correct++;
        }

        questionAttempts.push({
          questionId: q.id,
          section: q.section,
          difficulty: q.difficulty,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          userAnswer: userAnswer as "A" | "B" | "C" | "D" | null,
          isCorrect,
          isSkipped,
          isMarked: attempt.markedForReview?.has?.(q.id) ?? false,
          timeSpent: timePerQuestion?.[q.id] ?? 0,
          explanation: q.explanation,
        });
      });

      const totalQuestions = selectedQuestions.length;
      const result: TestResult = {
        attemptId: attempt.id,
        testId: attempt.testId,
        testName: attempt.testName,
        totalQuestions,
        correctAnswers: correctCount,
        wrongAnswers: totalQuestions - correctCount - skippedCount,
        skipped: skippedCount,
        accuracy: totalQuestions ? Math.round((correctCount / totalQuestions) * 100) : 0,
        timeTaken,
        duration: attempt.duration,
        completedAt,
        sectionPerformance: sectionPerf,
        difficultyPerformance: difficultyPerf,
        questionAttempts,
        questionOrder: attempt.questionOrder,
        questionsSnapshot: snapshot,
        filters: attempt.filters,
      };

      set((state) => ({ testResults: [...state.testResults, result], currentAttempt: null }));
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        await fetch(`/api/test-results`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(result),
          signal: controller.signal,
        });

        clearTimeout(timeout);
      } catch (e) {
        console.error("Failed to save test result to server:", e);
      }
      get().saveToStorage();
    },

    updateAnswers: (questionId: number, answer: "A" | "B" | "C" | "D" | null) => {
      set((state) => {
        if (!state.currentAttempt) return state;
        return {
          currentAttempt: {
            ...state.currentAttempt,
            answers: {
              ...state.currentAttempt.answers,
              [questionId]: answer,
            },
          },
        };
      });
    },

    toggleMarkForReview: (questionId: number) => {
      set((state) => {
        if (!state.currentAttempt) return state;
        const marked = new Set(state.currentAttempt.markedForReview);
        if (marked.has(questionId)) {
          marked.delete(questionId);
        } else {
          marked.add(questionId);
        }
        return {
          currentAttempt: {
            ...state.currentAttempt,
            markedForReview: marked,
          },
        };
      });
    },

    getCurrentTest: () => {
      const attempt = get().currentAttempt;
      if (!attempt) return undefined;

      if (attempt.questionsSnapshot?.length) {
        return {
          id: attempt.testId,
          testName: attempt.testName,
          duration: attempt.duration,
          questions: attempt.questionsSnapshot,
          createdAt: 0,
        } as TestBank;
      }

      const test = get().testBanks.find((t) => t.id === attempt.testId);
      if (!test) return undefined;
      const effective: TestBank = { ...test, duration: attempt.duration };
      if (!attempt.questionOrder?.length) return effective;

      const orderedQuestions = attempt.questionOrder
        .map((questionId) => test.questions.find((q) => q.id === questionId))
        .filter((q): q is Question => Boolean(q));

      return { ...effective, questions: orderedQuestions };
    },

    startPracticeSession: (config) => {
      const realBankIds = get()
        .testBanks.filter((b) => !b.id.startsWith("pooled_"))
        .map((b) => b.id);
      if (realBankIds.length === 0) return null;
      return get().startPooledTest(realBankIds, config.name, {
        sections: config.sections,
        difficulties: config.difficulties,
        count: config.count,
        duration: config.duration,
        shuffleQuestions: config.shuffleQuestions,
        shuffleOptions: config.shuffleOptions,
      });
    },

    getQuestionPoolStats: () => {
      const banks = get().testBanks.filter((b) => !b.id.startsWith("pooled_"));
      const all = banks.flatMap((b) => b.questions);
      const bySection: Record<string, number> = {};
      const byDifficulty: Record<"easy" | "medium" | "hard", number> = { easy: 0, medium: 0, hard: 0 };
      all.forEach((q) => {
        bySection[q.section] = (bySection[q.section] || 0) + 1;
        if (q.difficulty in byDifficulty) {
          byDifficulty[q.difficulty as "easy" | "medium" | "hard"]++;
        }
      });
      return {
        totalQuestions: all.length,
        totalSections: Object.keys(bySection).length,
        totalImports: banks.length,
        bySection,
        byDifficulty,
      };
    },

    getTestResults: () => {
      return get().testResults;
    },

    getDashboardStats: () => {
      const results = get().testResults;
      if (results.length === 0) {
        return { totalTests: 0, avgAccuracy: 0, totalTime: 0 };
      }

      const avgAccuracy = Math.round(results.reduce((sum, r) => sum + r.accuracy, 0) / results.length);
      const totalTime = results.reduce((sum, r) => sum + r.timeTaken, 0);

      return {
        totalTests: results.length,
        avgAccuracy,
        totalTime,
      };
    },
  };
});

// Auto-initialize store from server when running in the browser
if (typeof window !== "undefined") {
  (async () => {
    try {
      await useAppStore.getState().loadFromStorage();
    } catch (e) {
      // ignore
    }
  })();
}
