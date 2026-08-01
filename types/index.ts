export type Difficulty = "easy" | "medium" | "hard";
export type QuestionOrderMode = "latest" | "earliest" | "random";

export interface Question {
  id: number;
  section: string;
  difficulty: Difficulty;
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

export interface PaperFilterPreset {
  id: string;
  name: string;
  sections: string[];
  difficulties: Difficulty[];
  questionCount: number | "all";
  duration: number;
  orderMode?: QuestionOrderMode;
  createdAt: number;
}

export interface TestAttempt {
  id: string;
  testId: string;
  testName: string;
  startedAt: number;
  completedAt?: number;
  /** Effective duration for this attempt (may differ from test bank default). */
  duration: number;
  questionOrder: number[];
  answers: Record<number, "A" | "B" | "C" | "D" | null>;
  markedForReview: Set<number>;
  timePerQuestion: Record<number, number>;
  /** Per-attempt snapshot of questions (with shuffled options if enabled). */
  questionsSnapshot?: Question[];
  /** Filters used to build this attempt — surfaced on /profile and used by retry. */
  filters?: {
    sections: string[];
    difficulties: Difficulty[];
    count?: number;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    orderMode?: QuestionOrderMode;
    sourceBankIds?: string[];
  };
}

export interface QuestionAttempt {
  questionId: number;
  section: string;
  difficulty: Difficulty;
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correctAnswer: "A" | "B" | "C" | "D";
  userAnswer: "A" | "B" | "C" | "D" | null;
  isCorrect: boolean;
  isSkipped: boolean;
  isMarked: boolean;
  timeSpent: number;
  explanation: string;
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
  /** Duration (in minutes) configured for this attempt. */
  duration?: number;
  completedAt: number;
  sectionPerformance: Record<string, { correct: number; total: number }>;
  difficultyPerformance: Record<string, { correct: number; total: number }>;
  /** Per-question record for post-test review (which questions were wrong, your answer, etc.) */
  questionAttempts?: QuestionAttempt[];
  /** Question IDs in the order shown — used by retry-exact-same-questions. */
  questionOrder?: number[];
  /** Frozen per-question snapshot (preserves shuffled option order if any). */
  questionsSnapshot?: Question[];
  /** Original filter set, so retry can re-apply or display them. */
  filters?: {
    sections: string[];
    difficulties: Difficulty[];
    count?: number;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    orderMode?: QuestionOrderMode;
    sourceBankIds?: string[];
  };
}

export interface AnswerState {
  questionId: number;
  answer: "A" | "B" | "C" | "D" | null;
  isMarked: boolean;
  timeSpent: number;
}

export type RequestStatus = "pending" | "under_review" | "approved" | "rejected" | "requires_changes";
export type RequestType = "create_paper" | "add_questions" | "general";

export interface AuditLogEntry {
  status: RequestStatus;
  action: string;
  timestamp: number; // UTC timestamp
  changedBy: string; // name (email)
  remarks?: string;
}

export interface RequestPayload {
  // create_paper
  testName?: string;
  duration?: number;
  questions?: Question[];

  // add_questions
  testId?: string;
  newQuestions?: Question[];

  // general
  subject?: string;
  category?: "feature" | "incorrect_question" | "correction" | "technical" | "suggestion";
  description?: string;
  attachmentName?: string;
  attachmentData?: string; // base64
}

export interface RequestDocument {
  _id?: string;
  requestNumber: string;
  type: RequestType;
  title: string;
  status: RequestStatus;
  userId: string;
  userName: string;
  userEmail: string;
  version: number;
  payload: RequestPayload;
  createdAt: number;
  updatedAt: number;
  adminRemarks?: string;
  reviewedBy?: string;
  reviewedAt?: number;
  history: AuditLogEntry[];
}

export interface NotificationDocument {
  _id?: string;
  userId: string;
  requestNumber: string;
  type: "submitted" | "under_review" | "approved" | "rejected" | "changes_requested";
  message: string;
  read: boolean;
  createdAt: number;
}

