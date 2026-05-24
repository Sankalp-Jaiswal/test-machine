import * as pdfjsLib from "pdfjs-dist";
import * as mammoth from "mammoth";

// Set up PDF worker
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
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

export async function extractQuestionsFromText(
  text: string,
  testName: string = "Imported Test"
): Promise<{
  testName: string;
  duration: number;
  questions: Array<{
    id: number;
    section: string;
    difficulty: "easy" | "medium" | "hard";
    question: string;
    options: { A: string; B: string; C: string; D: string };
    correctAnswer: "A" | "B" | "C" | "D";
    explanation: string;
  }>;
}> {
  // Try to parse as JSON first
  try {
    const parsed = JSON.parse(text);
    if (parsed.testName && parsed.questions && Array.isArray(parsed.questions)) {
      return {
        testName: parsed.testName,
        duration: parsed.duration || 30,
        questions: parsed.questions.map((q: any, idx: number) => ({
          id: q.id || idx + 1,
          section: q.section || "General",
          difficulty: q.difficulty || "medium",
          question: q.question,
          options: q.options || { A: "", B: "", C: "", D: "" },
          correctAnswer: q.correctAnswer || "A",
          explanation: q.explanation || "",
        })),
      };
    }
  } catch (_) {
    // Continue with text parsing
  }

  // Parse structured text (Q1, Q2, ... with A) B) C) D) format)
  const lines = text.split("\n").filter((l) => l.trim());
  const questions: any[] = [];
  let currentQuestion: any = null;
  let optionBuffer: { [key: string]: string } = {};

  for (const line of lines) {
    const trimmed = line.trim();

    // Match Q1., Q2., etc
    const qMatch = trimmed.match(/^Q(\d+)[.:)\s]/i);
    if (qMatch) {
      if (currentQuestion) {
        currentQuestion.options = optionBuffer;
        questions.push(currentQuestion);
      }
      currentQuestion = {
        id: questions.length + 1,
        question: trimmed.replace(/^Q\d+[.:)\s]*/i, "").trim(),
        section: "General",
        difficulty: "medium" as const,
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

  if (currentQuestion) {
    currentQuestion.options = optionBuffer;
    questions.push(currentQuestion);
  }

  // Ensure all questions have required options
  const normalizedQuestions = questions
    .filter((q) => q.question && Object.keys(q.options || {}).length > 0)
    .map((q, idx) => ({
      id: idx + 1,
      section: q.section || "General",
      difficulty: q.difficulty || ("medium" as const),
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
