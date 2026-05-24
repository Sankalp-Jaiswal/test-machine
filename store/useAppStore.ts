import { create } from "zustand";
import { TestBank, TestAttempt, TestResult } from "@/types";
import { DEMO_TESTS } from "@/lib/demoData";

interface AppState {
  testBanks: TestBank[];
  testResults: TestResult[];
  currentAttempt: TestAttempt | null;
  addTestBank: (test: TestBank) => void;
  deleteTestBank: (id: string) => void;
  startTest: (testId: string) => void;
  endTest: (answers: Record<number, string | null>, timePerQuestion: Record<number, number>) => void;
  updateAnswers: (questionId: number, answer: "A" | "B" | "C" | "D" | null) => void;
  toggleMarkForReview: (questionId: number) => void;
  getCurrentTest: () => TestBank | undefined;
  getTestResults: () => TestResult[];
  getDashboardStats: () => { totalTests: number; avgAccuracy: number; totalTime: number };
  loadFromStorage: () => void;
  saveToStorage: () => void;
}

const loadInitialState = () => {
  if (typeof window === "undefined") return { testBanks: DEMO_TESTS, testResults: [] };
  
  try {
    const saved = localStorage.getItem("cil-prep-arena");
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        testBanks: parsed.testBanks || DEMO_TESTS,
        testResults: parsed.testResults || [],
      };
    }
  } catch (e) {
    console.error("Failed to load from storage:", e);
  }
  return { testBanks: DEMO_TESTS, testResults: [] };
};

export const useAppStore = create<AppState>((set, get) => {
  const initial = loadInitialState();

  return {
    testBanks: initial.testBanks,
    testResults: initial.testResults,
    currentAttempt: null,

    saveToStorage: () => {
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

    loadFromStorage: () => {
      const initial = loadInitialState();
      set({
        testBanks: initial.testBanks,
        testResults: initial.testResults,
      });
    },

    addTestBank: (test: TestBank) => {
      set((state) => ({
        testBanks: [...state.testBanks, test],
      }));
      get().saveToStorage();
    },

    deleteTestBank: (id: string) => {
      set((state) => ({
        testBanks: state.testBanks.filter((test) => test.id !== id),
      }));
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

    endTest: (answers, timePerQuestion) => {
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

      test.questions.forEach((q) => {
        const isCorrect = answers[q.id] === q.correctAnswer;
        if (answers[q.id] === null) skippedCount++;
        if (isCorrect) correctCount++;

        if (!sectionPerf[q.section]) sectionPerf[q.section] = { correct: 0, total: 0 };
        if (!difficultyPerf[q.difficulty]) difficultyPerf[q.difficulty] = { correct: 0, total: 0 };

        sectionPerf[q.section].total++;
        difficultyPerf[q.difficulty].total++;
        if (isCorrect) {
          sectionPerf[q.section].correct++;
          difficultyPerf[q.difficulty].correct++;
        }
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
      };

      set((state) => ({
        testResults: [...state.testResults, result],
        currentAttempt: null,
      }));
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
