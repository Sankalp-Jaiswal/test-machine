import * as pdfjsLib from "pdfjs-dist";
import * as mammoth from "mammoth";
import { normalizeSection } from "@/lib/sectionNormalizer";

// Set up PDF worker
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export type Difficulty = "easy" | "medium" | "hard";
export { normalizeSection };

type ParsedTestPayload = {
  testName: string;
  duration: number;
  questions: ParsedQuestion[];
};

function stripMarkdownCodeFences(text: string): string {
  return text.replace(/```(?:json|txt|text)?\s*([\s\S]*?)```/gi, "$1");
}

function extractJsonBlockCandidates(text: string): string[] {
  const blocks: string[] = [];
  let start = -1;
  let depth = 0;
  let inString = false;
  let quoteChar = "";
  let escaped = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (ch === quoteChar) {
        inString = false;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = true;
      quoteChar = ch;
      continue;
    }

    if (ch === "{" || ch === "[") {
      if (depth === 0) start = i;
      depth += 1;
      continue;
    }

    if (ch === "}" || ch === "]") {
      if (depth === 0) continue;
      depth -= 1;
      if (depth === 0 && start >= 0) {
        const candidate = text.slice(start, i + 1).trim();
        if (candidate) blocks.push(candidate);
        start = -1;
      }
    }
  }

  return blocks;
}

function parseJsonCandidates(text: string): any[] {
  const cleaned = stripMarkdownCodeFences(text).trim();
  if (!cleaned) return [];

  try {
    return [JSON.parse(cleaned)];
  } catch (_) {
    // Continue with block-level parsing.
  }

  const blocks = extractJsonBlockCandidates(cleaned);
  const parsed: any[] = [];
  for (const block of blocks) {
    try {
      parsed.push(JSON.parse(block));
    } catch (_) {
      // Ignore invalid block and continue.
    }
  }
  return parsed;
}

/**
 * Normalize a free-form difficulty string into the canonical
 * "easy" | "medium" | "hard" used everywhere else in the app.
 * Anything unrecognized falls back to "medium".
 */
export function normalizeDifficulty(value: unknown): Difficulty {
  if (typeof value !== "string") return "medium";
  const v = value.trim().toLowerCase();
  if (!v) return "medium";
  if (["easy", "simple", "basic", "beginner", "low"].includes(v)) return "easy";
  if (["hard", "difficult", "tough", "advanced", "expert", "high"].includes(v)) return "hard";
  // medium / moderate / intermediate / normal / average / mid
  return "medium";
}

export async function parsePdfFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(" ");
    text += pageText + "\n";
  }

  return text;
}

export async function parseDocxFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

interface ParsedQuestion {
  id: number;
  section: string;
  difficulty: Difficulty;
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correctAnswer: "A" | "B" | "C" | "D";
  explanation: string;
}

const normalizeQuestion = (q: any, idx: number, fallbackSection: string): ParsedQuestion => ({
  id: q?.id || idx + 1,
  section: normalizeSection(q?.section ?? q?.sectionName ?? q?.topic ?? q?.subject ?? fallbackSection),
  difficulty: normalizeDifficulty(q?.difficulty),
  question: q?.question || "",
  options: q?.options || { A: "", B: "", C: "", D: "" },
  correctAnswer: q?.correctAnswer || "A",
  explanation: q?.explanation || "",
});

export function parseTestJsonPayload(
  parsed: any,
  fallbackName = "Imported Test",
  fallbackDuration = 30,
): ParsedTestPayload {
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid JSON format. Expected an object.");
  }

  const testName =
    typeof parsed.testName === "string" && parsed.testName.trim()
      ? parsed.testName.trim()
      : fallbackName;
  const duration =
    typeof parsed.duration === "number" && Number.isFinite(parsed.duration) && parsed.duration > 0
      ? parsed.duration
      : fallbackDuration;
  const fallbackSection = normalizeSection(parsed.defaultSection ?? parsed.subject ?? parsed.section ?? parsed.topic);

  let questionRows: any[] = [];

  if (Array.isArray(parsed)) {
    questionRows = parsed;
  } else if (Array.isArray(parsed.questions)) {
    questionRows = parsed.questions;
  } else if (Array.isArray(parsed.sections)) {
    questionRows = parsed.sections.flatMap((s: any) => {
      const sectionName = normalizeSection(s?.section ?? s?.sectionName ?? s?.name ?? s?.title ?? fallbackSection);
      const sectionQuestions = Array.isArray(s?.questions)
        ? s.questions
        : Array.isArray(s?.items)
        ? s.items
        : [];
      return sectionQuestions.map((q: any) => ({
        ...q,
        section: q?.section ?? q?.sectionName ?? sectionName,
      }));
    });
  } else {
    throw new Error("Invalid format. Required fields: questions[] or sections[].");
  }

  return {
    testName,
    duration,
    questions: questionRows.map((q: any, idx: number) => normalizeQuestion(q, idx, fallbackSection)),
  };
}

export async function extractQuestionsFromText(
  text: string,
  testName: string = "Imported Test"
): Promise<{
  testName: string;
  duration: number;
  questions: ParsedQuestion[];
}> {
  // Try to parse as one-or-many JSON payloads first
  try {
    const parsedCandidates = parseJsonCandidates(text);
    const payloads = parsedCandidates
      .map((candidate) => {
        try {
          return parseTestJsonPayload(candidate, testName, 30);
        } catch (_) {
          return null;
        }
      })
      .filter((p): p is ParsedTestPayload => Boolean(p));

    if (payloads.length > 0) {
      const mergedQuestions = payloads.flatMap((p) => p.questions).map((q, idx) => ({ ...q, id: idx + 1 }));
      return {
        testName: payloads[0].testName || testName,
        duration: payloads[0].duration || 30,
        questions: mergedQuestions,
      };
    }
  } catch (_) {
    // Continue with text parsing
  }

  // Parse structured text (Q1, Q2, ... with A) B) C) D) format)
  // Also recognize:
  //   Section: <name> / Section - <name>  → applied to subsequent Qs until next override
  //   Difficulty: <level>                  → applied to subsequent Qs until next override
  //   Inline tags on Q line: Q1. [Quant][Hard] ...
  const lines = text.split("\n").filter((l) => l.trim());
  const questions: any[] = [];
  let currentQuestion: any = null;
  let optionBuffer: { [key: string]: string } = {};
  let currentSection = "General";
  let currentDifficulty: Difficulty = "medium";

  const pushCurrent = () => {
    if (!currentQuestion) return;
    currentQuestion.options = optionBuffer;
    questions.push(currentQuestion);
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Section heading (standalone)
    const sectionHeading = trimmed.match(/^(?:Section|Topic|Subject|Chapter)\s*[:\-]\s*(.+)$/i);
    if (sectionHeading) {
      currentSection = normalizeSection(sectionHeading[1]);
      continue;
    }

    // Difficulty heading (standalone)
    const difficultyHeading = trimmed.match(/^(?:Difficulty|Level)\s*[:\-]\s*(.+)$/i);
    if (difficultyHeading) {
      currentDifficulty = normalizeDifficulty(difficultyHeading[1]);
      continue;
    }

    // Match Q1., Q2., etc — optionally followed by inline [Section][Difficulty] tags
    const qMatch = trimmed.match(/^Q(\d+)[.:)\s]/i);
    if (qMatch) {
      pushCurrent();
      let rest = trimmed.replace(/^Q\d+[.:)\s]*/i, "").trim();

      // Pull out leading [tag] markers and decide which is section vs difficulty
      let section = currentSection;
      let difficulty = currentDifficulty;
      const tagPattern = /^\[([^\]]+)\]\s*/;
      let tagMatch: RegExpMatchArray | null = null;
      while ((tagMatch = rest.match(tagPattern))) {
        const tagValue = tagMatch[1].trim();
        const lower = tagValue.toLowerCase();
        if (
          ["easy", "simple", "basic", "beginner", "low",
           "medium", "moderate", "intermediate", "normal", "average", "mid",
           "hard", "difficult", "tough", "advanced", "expert", "high"].includes(lower)
        ) {
          difficulty = normalizeDifficulty(tagValue);
        } else {
          section = normalizeSection(tagValue);
        }
        rest = rest.replace(tagPattern, "");
      }

      currentQuestion = {
        id: questions.length + 1,
        question: rest,
        section,
        difficulty,
      };
      optionBuffer = {};
      continue;
    }

    // Match A) B) C) D) options
    const optMatch = trimmed.match(/^([A-D])[)\s.]/);
    if (optMatch && currentQuestion) {
      const optLabel = optMatch[1] as "A" | "B" | "C" | "D";
      optionBuffer[optLabel] = trimmed.replace(/^[A-D][)\s.]*/, "").trim();
      continue;
    }

    // Match answer line (Ans: A or Answer: C)
    const ansMatch = trimmed.match(/^(?:Ans|Answer)[:\s]+([A-D])/i);
    if (ansMatch && currentQuestion) {
      currentQuestion.correctAnswer = ansMatch[1] as "A" | "B" | "C" | "D";
      continue;
    }

    // Match explanation
    if (trimmed.match(/^(?:Exp|Explanation)[:\s]/i) && currentQuestion) {
      currentQuestion.explanation = trimmed.replace(/^(?:Exp|Explanation)[:\s]*/, "").trim();
    }
  }

  pushCurrent();

  // Ensure all questions have required options
  const normalizedQuestions: ParsedQuestion[] = questions
    .filter((q) => q.question && Object.keys(q.options || {}).length > 0)
    .map((q, idx) => ({
      id: idx + 1,
      section: normalizeSection(q.section),
      difficulty: normalizeDifficulty(q.difficulty),
      question: q.question,
      options: {
        A: q.options?.A || "",
        B: q.options?.B || "",
        C: q.options?.C || "",
        D: q.options?.D || "",
      },
      correctAnswer: q.correctAnswer || ("A" as const),
      explanation: q.explanation || "",
    }));

  return {
    testName,
    duration: 30,
    questions: normalizedQuestions,
  };
}
