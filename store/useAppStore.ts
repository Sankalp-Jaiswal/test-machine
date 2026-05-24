import { create } from "zustand";
import { TestBank, TestAttempt, TestResult, QuestionAttempt } from "@/types";
import { DEMO_TESTS } from "@/lib/demoData";

interface AppState {
  testBanks: TestBank[];
  testResults: TestResult[];
  currentAttempt: TestAttempt | null;
  isInitialized: boolean;
  addTestBank: (test: TestBank) => Promise<void>;
  deleteTestBank: (id: string) => Promise<void>;
  startTest: (testId: string) => void;
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
  // synchronous fallback (used during server-side rendering)
  if (typeof window === "undefined") return { testBanks: DEMO_TESTS, testResults: [] };
  return { testBanks: DEMO_TESTS, testResults: [] };
};

export const useAppStore = create<AppState>((set, get) => {
  const initial = loadInitialState();

  return {
    testBanks: initial.testBanks,
    testResults: initial.testResults,
    currentAttempt: null,
    isInitialized: false,

    saveToStorage: () => {
      // keep localStorage as a fallback offline cache
      if (typeof window === "undefined") return;
      try {
        localStorage.setItem(
          "cil-prep-arena",
          JSON.stringify({
            testBanks: get().testBanks,
            testResults: get().testResults,
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
        const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const [banksRes, resultsRes] = await Promise.all([
          fetch(`/api/test-banks`, { signal: controller.signal }).then((r) => (r.ok ? r.json() : { __unauth: r.status === 401 })),
          fetch(`/api/test-results`, { signal: controller.signal }).then((r) => (r.ok ? r.json() : { __unauth: r.status === 401 })),
        ]);

        clearTimeout(timeout);

        // unauthenticated — show demo content only, do not surface a server failure
        if (
          (banksRes && typeof banksRes === "object" && banksRes.__unauth) ||
          (resultsRes && typeof resultsRes === "object" && resultsRes.__unauth)
        ) {
          set({ testBanks: DEMO_TESTS, testResults: [], isInitialized: true });
          return;
        }

        const testBanks = Array.isArray(banksRes) && banksRes.length > 0 ? banksRes : DEMO_TESTS;
        const testResults = Array.isArray(resultsRes) ? resultsRes : [];

        set({ testBanks, testResults, isInitialized: true });
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
          testBanks: saved?.testBanks || DEMO_TESTS,
          testResults: saved?.testResults || [],
          isInitialized: true,
        });
      }
    },

    addTestBank: async (test: TestBank) => {
      set((state) => ({ testBanks: [...state.testBanks, test] }));
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        await fetch(`/api/test-banks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(test),
          signal: controller.signal,
        });

        clearTimeout(timeout);
      } catch (e) {
        console.error("Failed to save test bank to server:", e);
      }
      get().saveToStorage();
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

    startTest: (testId: string) => {
      const testBanks = get().testBanks;
      const test = testBanks.find((t) => t.id === testId);
      if (test) {
        const attempt: TestAttempt = {
          id: `attempt_${Date.now()}`,
          testId,
          testName: test.testName,
          startedAt: Date.now(),
          answers: Object.fromEntries(test.questions.map((q) => [q.id, null])),
          markedForReview: new Set(),
          timePerQuestion: Object.fromEntries(test.questions.map((q) => [q.id, 0])),
        };
        set({ currentAttempt: attempt });
      }
    },

    endTest: async (answers, timePerQuestion) => {
      const attempt = get().currentAttempt;
      const testBanks = get().testBanks;
      if (!attempt) return;

      const test = testBanks.find((t) => t.id === attempt.testId);
      if (!test) return;

      const completedAt = Date.now();
      const timeTaken = Math.round((completedAt - attempt.startedAt) / 1000);

      let correctCount = 0;
      let skippedCount = 0;
      const sectionPerf: Record<string, { correct: number; total: number }> = {};
      const difficultyPerf: Record<string, { correct: number; total: number }> = {};
      const questionAttempts: QuestionAttempt[] = [];

      test.questions.forEach((q) => {
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
          userAnswer,
          isCorrect,
          isSkipped,
          isMarked: attempt.markedForReview?.has?.(q.id) ?? false,
          timeSpent: timePerQuestion?.[q.id] ?? 0,
          explanation: q.explanation,
        });
      });

      const result: TestResult = {
        attemptId: attempt.id,
        testId: attempt.testId,
        testName: attempt.testName,
        totalQuestions: test.questions.length,
        correctAnswers: correctCount,
        wrongAnswers: test.questions.length - correctCount - skippedCount,
        skipped: skippedCount,
        accuracy: Math.round((correctCount / test.questions.length) * 100),
        timeTaken,
        completedAt,
        sectionPerformance: sectionPerf,
        difficultyPerformance: difficultyPerf,
        questionAttempts,
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
      return get().testBanks.find((t) => t.id === attempt.testId);
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
