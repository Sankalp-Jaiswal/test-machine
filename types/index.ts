export interface Question {
  id: number;
  section: string;
  difficulty: "easy" | "medium" | "hard";
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: "A" | "B" | "C" | "D";
  explanation: string;
}

export interface TestBank {
  id: string;
  testName: string;
  duration: number; // in minutes
  questions: Question[];
  createdAt: number;
}

export interface TestAttempt {
  id: string;
  testId: string;
  testName: string;
  startedAt: number;
  completedAt?: number;
  answers: Record<number, "A" | "B" | "C" | "D" | null>;
  markedForReview: Set<number>;
  timePerQuestion: Record<number, number>;
}

export interface TestResult {
  attemptId: string;
  testId: string;
  testName: string;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  skipped: number;
  accuracy: number;
  timeTaken: number;
  completedAt: number;
  sectionPerformance: Record<string, { correct: number; total: number }>;
  difficultyPerformance: Record<string, { correct: number; total: number }>;
}

export interface AnswerState {
  questionId: number;
  answer: "A" | "B" | "C" | "D" | null;
  isMarked: boolean;
  timeSpent: number;
}
