"use client";

import { useMemo, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { Upload, ClipboardPaste, CheckCircle, Clock, Layers, Gauge } from "lucide-react";
import toast from "react-hot-toast";
import {
  parsePdfFile,
  parseDocxFile,
  extractQuestionsFromText,
  parseTestJsonPayload,
  normalizeDifficulty,
  normalizeSection,
} from "@/lib/fileParser";

type ImportedQuestion = {
  id: number;
  section: string;
  difficulty: "easy" | "medium" | "hard";
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correctAnswer: "A" | "B" | "C" | "D";
  explanation: string;
};

type ImportedTest = {
  id: string;
  testName: string;
  duration: number;
  createdAt: number;
  questions: ImportedQuestion[];
};

const buildTestFromJson = (parsed: any, fallbackDuration = 30): ImportedTest => {
  const payload = parseTestJsonPayload(parsed, "Imported Test", fallbackDuration);
  return {
    id: `test_${Date.now()}`,
    testName: payload.testName,
    duration: payload.duration,
    createdAt: Date.now(),
    questions: payload.questions.map((q: any, idx: number) => ({
      id: q.id || idx + 1,
      section: normalizeSection(q.section),
      difficulty: normalizeDifficulty(q.difficulty),
      question: q.question,
      options: q.options || { A: "", B: "", C: "", D: "" },
      correctAnswer: q.correctAnswer || "A",
      explanation: q.explanation || "",
    })),
  };
};

export function ImportTest() {
  const router = useRouter();
  const [jsonInput, setJsonInput] = useState("");
  const [importedTest, setImportedTest] = useState<ImportedTest | null>(null);
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [showTimeSelection, setShowTimeSelection] = useState(false);
  const addTestBank = useAppStore((state) => state.addTestBank);

  const breakdown = useMemo(() => {
    if (!importedTest) return null;
    const bySection: Record<string, number> = {};
    const byDifficulty: Record<string, number> = { easy: 0, medium: 0, hard: 0 };
    importedTest.questions.forEach((q) => {
      bySection[q.section] = (bySection[q.section] || 0) + 1;
      byDifficulty[q.difficulty] = (byDifficulty[q.difficulty] || 0) + 1;
    });
    return { bySection, byDifficulty };
  }, [importedTest]);

  const handleJsonImport = async () => {
    try {
      setLoading(true);
      const parsed = JSON.parse(jsonInput);
      const test = buildTestFromJson(parsed, selectedDuration);
      setImportedTest(test);
      setSelectedDuration(test.duration);
      setShowTimeSelection(false);
      toast.success(`Parsed ${test.questions.length} questions across ${new Set(test.questions.map((q) => q.section)).size} section(s)`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid JSON format");
      setImportedTest(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setLoading(true);
      const fileContents = await Promise.all(
        files.map(async (file) => {
          if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
            return { name: file.name, text: await parsePdfFile(file) };
          }
          if (
            file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
            file.name.toLowerCase().endsWith(".docx")
          ) {
            return { name: file.name, text: await parseDocxFile(file) };
          }
          if (
            file.type === "application/json" ||
            file.type === "text/plain" ||
            file.name.toLowerCase().endsWith(".json") ||
            file.name.toLowerCase().endsWith(".txt")
          ) {
            return { name: file.name, text: await file.text() };
          }
          throw new Error(`Unsupported file format: ${file.name}. Use JSON, TXT, PDF, or DOCX.`);
        })
      );

      const combined = fileContents
        .map((f) => `\n/* FILE: ${f.name} */\n${f.text.trim()}`)
        .join("\n\n");
      setJsonInput(combined.trim());
      toast.success(`Loaded ${files.length} file(s) successfully`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to read file");
    } finally {
      setLoading(false);
    }
  };

  const handleParsedImport = async (testData: { testName: string; questions: ImportedQuestion[] }) => {
    try {
      setLoading(true);
      const test: ImportedTest = {
        id: `test_${Date.now()}`,
        testName: testData.testName,
        duration: selectedDuration,
        createdAt: Date.now(),
        questions: testData.questions.map((q, idx) => ({
          id: q.id || idx + 1,
          section: normalizeSection(q.section),
          difficulty: normalizeDifficulty(q.difficulty),
          question: q.question,
          options: q.options || { A: "", B: "", C: "", D: "" },
          correctAnswer: q.correctAnswer || "A",
          explanation: q.explanation || "",
        })),
      };

      setImportedTest(test);
      setShowTimeSelection(true);
      toast.success(`Extracted ${test.questions.length} questions across ${new Set(test.questions.map((q) => q.section)).size} section(s)`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to parse questions");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importedTest) return;
    try {
      setLoading(true);
      const testWithDuration = {
        ...importedTest,
        duration: selectedDuration,
      };
      await addTestBank(testWithDuration);
      toast.success("Test bank added successfully!");
      router.push("/");
    } catch (error) {
      toast.error("Failed to save test bank");
    } finally {
      setLoading(false);
    }
  };

  const handleImportFromFile = async () => {
    if (!jsonInput) {
      toast.error("Please upload or paste content first");
      return;
    }

    try {
      setLoading(true);
      let testName = "Imported Test";
      const text = jsonInput;

      // Try to extract test name from simple JSON
      try {
        const parsed = JSON.parse(jsonInput);
        testName = parsed.testName || testName;
      } catch (_) {
        // Multi-part JSON or text content; parser handles this.
      }

      const testData = await extractQuestionsFromText(text, testName);
      await handleParsedImport(testData);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to parse file");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ambient-bg w-full space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Import Test Bank</h1>
        <p className="text-muted-foreground">
          Upload JSON, TXT, PDF, or DOCX (single or multiple files) • Questions are auto-grouped by section and difficulty
        </p>
      </motion.div>

      {!importedTest && !showTimeSelection ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* PDF Upload */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }}>
            <Card className="glass rounded-2xl border-border/70 p-6 cursor-pointer hover:border-primary/50 transition-all duration-300">
              <label className="flex flex-col items-center justify-center h-full cursor-pointer">
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg mb-4">
                  <Upload className="w-7 h-7 text-primary" />
                </div>
                <p className="text-foreground font-semibold mb-1">Upload PDF</p>
                <p className="text-sm text-muted-foreground text-center mb-4">Click to select PDF file</p>
                <input
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button variant="outline" className="border-border/80 hover:bg-secondary/70">Select PDF</Button>
              </label>
            </Card>
          </motion.div>

          {/* DOCX Upload */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
            <Card className="glass rounded-2xl border-border/70 p-6 cursor-pointer hover:border-primary/50 transition-all duration-300">
              <label className="flex flex-col items-center justify-center h-full cursor-pointer">
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg mb-4">
                  <Upload className="w-7 h-7 text-primary" />
                </div>
                <p className="text-foreground font-semibold mb-1">Upload DOCX</p>
                <p className="text-sm text-muted-foreground text-center mb-4">Click to select Word file</p>
                <input
                  type="file"
                  accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button variant="outline" className="border-border/80 hover:bg-secondary/70">Select DOCX</Button>
              </label>
            </Card>
          </motion.div>

          {/* JSON Upload */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}>
            <Card className="glass rounded-2xl border-border/70 p-6 cursor-pointer hover:border-primary/50 transition-all duration-300">
              <label className="flex flex-col items-center justify-center h-full cursor-pointer">
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg mb-4">
                  <Upload className="w-7 h-7 text-primary" />
                </div>
                <p className="text-foreground font-semibold mb-1">Upload JSON/TXT</p>
                <p className="text-sm text-muted-foreground text-center mb-4">Click to select one or more JSON/TXT files</p>
                <input
                  type="file"
                  accept=".json,.txt,text/plain"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Select JSON</Button>
              </label>
            </Card>
          </motion.div>
        </div>
      ) : null}

      {!importedTest && !showTimeSelection ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <Card className="glass rounded-2xl border-border/70 p-8">
            <p className="text-foreground font-semibold mb-4">Or Paste Content</p>
            <Textarea
              placeholder='Paste JSON, plain text with Q1, Q2... format, or PDF/DOCX text content'
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="h-48 bg-background/70 border-border/60 text-foreground placeholder:text-muted-foreground/70 mb-4 resize-none"
            />
            <div className="flex gap-3">
              <Button
                onClick={handleImportFromFile}
                disabled={!jsonInput || loading}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              >
                <ClipboardPaste className="w-4 h-4" />
                {loading ? "Processing..." : "Parse Questions"}
              </Button>
              <Button
                onClick={handleJsonImport}
                disabled={!jsonInput || loading}
                variant="outline"
                className="flex-1 border-border/30 hover:border-primary/50 gap-2"
              >
                <ClipboardPaste className="w-4 h-4" />
                {loading ? "Parsing..." : "Import as JSON"}
              </Button>
            </div>
          </Card>
        </motion.div>
      ) : null}

      {showTimeSelection && importedTest ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
          <Card className="glass rounded-2xl border-border/70 p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-success/10 border border-success/30 rounded-lg">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">{importedTest.testName}</h2>
                <p className="text-muted-foreground">{importedTest.questions.length} questions found</p>
              </div>
            </div>

            {breakdown && <BreakdownBlock breakdown={breakdown} />}

            {/* Time Selection */}
            <div className="mb-6 rounded-xl border border-border/70 bg-background/70 p-6">
              <Label className="mb-4 flex items-center gap-2 text-foreground">
                <Clock className="w-4 h-4" />
                Default time duration (minutes) — you can override per-attempt at start time
              </Label>
              <div className="flex gap-3 flex-wrap mt-4">
                {[15, 20, 30, 45, 60, 90, 120].map((time) => (
                  <Button
                    key={time}
                    onClick={() => setSelectedDuration(time)}
                    variant={selectedDuration === time ? "default" : "outline"}
                    className={`${
                      selectedDuration === time
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border/30 hover:border-primary/50"
                    }`}
                  >
                    {time} min
                  </Button>
                ))}
              </div>
              <div className="mt-4">
                <Label className="text-muted-foreground text-sm">Or enter custom time:</Label>
                <Input
                  type="number"
                  min="1"
                  max="999"
                  value={selectedDuration}
                  onChange={(e) => setSelectedDuration(Math.max(1, parseInt(e.target.value) || 30))}
                  className="mt-2 border-border/70 bg-background"
                />
              </div>
            </div>

            {/* Questions Preview */}
            <div className="mb-6 max-h-96 overflow-auto">
              <h3 className="text-lg font-semibold text-foreground mb-4">Questions Preview</h3>
              <div className="space-y-3">
                {importedTest.questions.slice(0, 5).map((q, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
                    <div className="rounded-lg border border-border/70 bg-background/70 p-3">
                      <p className="text-sm text-foreground/90">
                        Q{idx + 1}. {q.question.substring(0, 60)}...
                      </p>
                      <p className="text-xs text-accent mt-1">{q.section} • {q.difficulty}</p>
                    </div>
                  </motion.div>
                ))}
                {importedTest.questions.length > 5 && (
                  <p className="text-sm text-muted-foreground pt-2">+{importedTest.questions.length - 5} more questions</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setImportedTest(null);
                  setJsonInput("");
                  setShowTimeSelection(false);
                }}
                variant="outline"
                className="flex-1 border-border/30 hover:border-primary/50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmImport}
                disabled={loading}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {loading ? "Saving..." : "Confirm Import"}
              </Button>
            </div>
          </Card>
        </motion.div>
      ) : null}

      {importedTest && !showTimeSelection ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
          <Card className="glass rounded-2xl border-border/70 p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-success/10 border border-success/30 rounded-lg">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">{importedTest.testName}</h2>
                <p className="text-muted-foreground">{importedTest.questions.length} questions • {selectedDuration} minutes</p>
              </div>
            </div>

            {breakdown && <BreakdownBlock breakdown={breakdown} />}

            {/* Questions Preview */}
            <div className="mb-6 max-h-96 overflow-auto">
              <h3 className="text-lg font-semibold text-foreground mb-4">Questions Preview</h3>
              <div className="space-y-3">
                {importedTest.questions.slice(0, 5).map((q, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
                    <div className="rounded-lg border border-border/70 bg-background/70 p-3">
                      <p className="text-sm text-foreground/90">Q{idx + 1}. {q.question.substring(0, 60)}...</p>
                      <p className="text-xs text-accent mt-1">{q.section} • {q.difficulty}</p>
                    </div>
                  </motion.div>
                ))}
                {importedTest.questions.length > 5 && (
                  <p className="text-sm text-muted-foreground pt-2">+{importedTest.questions.length - 5} more questions</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setImportedTest(null);
                  setJsonInput("");
                  setShowTimeSelection(false);
                }}
                variant="outline"
                className="flex-1 border-border/30 hover:border-primary/50"
              >
                Cancel
              </Button>
              <Button onClick={() => setShowTimeSelection(true)} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                Next: Select Time
              </Button>
            </div>
          </Card>
        </motion.div>
      ) : null}
      {/* Template */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="glass rounded-2xl border-border/70 p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Supported Formats</h3>
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-primary font-semibold mb-2">1. JSON Format (Full Control)</p>
              <pre className="overflow-x-auto rounded-lg border border-border/70 bg-background/80 p-3 text-xs text-foreground">
                {`{
  "testName": "CIL Mock 1",
  "duration": 30,
  "questions": [
    {
      "id": 1,
      "section": "Computer Networks",
      "difficulty": "moderate",
      "question": "Question text?",
      "options": {
        "A": "Option A", "B": "Option B",
        "C": "Option C", "D": "Option D"
      },
      "correctAnswer": "C",
      "explanation": "Why C is correct"
    }
  ]
}`}
              </pre>
              <p className="text-xs text-muted-foreground mt-2">
                Difficulty values like <code className="text-accent">moderate</code>,{" "}
                <code className="text-accent">simple</code>, <code className="text-accent">tough</code> are
                auto-mapped to easy / medium / hard.
              </p>
            </div>

            <div>
              <p className="text-primary font-semibold mb-2">2. Text Format (Auto-Parse)</p>
              <pre className="overflow-x-auto rounded-lg border border-border/70 bg-background/80 p-3 text-xs text-foreground">
                {`Section: Computer Networks
Difficulty: Easy

Q1. Default port number of HTTP is:
A) 20
B) 21
C) 80
D) 443
Ans: C
Exp: HTTP uses port 80

Q2. [Quant][Hard] What is 17 * 19?
A) 313
B) 323
C) 333
D) 343
Ans: B`}
              </pre>
              <p className="text-xs text-muted-foreground mt-2">
                Section/Difficulty headings apply to all following questions. Inline
                <code className="text-accent"> [Section][Difficulty] </code> tags on a Q-line override per-question.
              </p>
            </div>

            <div>
              <p className="text-primary font-semibold mb-2">3. PDF & DOCX Files</p>
              <p className="text-muted-foreground">Upload PDF or Word documents containing questions in any format above</p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

function BreakdownBlock({
  breakdown,
}: {
  breakdown: { bySection: Record<string, number>; byDifficulty: Record<string, number> };
}) {
  const sections = Object.entries(breakdown.bySection).sort((a, b) => b[1] - a[1]);
  const difficulties: Array<["easy" | "medium" | "hard", string]> = [
    ["easy", "bg-success/15 text-success ring-success/30"],
    ["medium", "bg-warning/15 text-warning ring-warning/30"],
    ["hard", "bg-destructive/15 text-destructive ring-destructive/30"],
  ];

  return (
    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-xl border border-border/70 bg-background/70 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Layers className="w-4 h-4 text-primary" /> Sections detected ({sections.length})
        </div>
        <div className="flex flex-wrap gap-2">
          {sections.map(([name, count]) => (
            <span
              key={name}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ring-1 bg-primary/10 text-primary ring-primary/30"
            >
              {name}
              <span className="text-[10px] text-primary/80">×{count}</span>
            </span>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-border/70 bg-background/70 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Gauge className="w-4 h-4 text-accent" /> Difficulty mix
        </div>
        <div className="flex flex-wrap gap-2">
          {difficulties.map(([level, tone]) => (
            <span
              key={level}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs uppercase tracking-[0.14em] font-semibold ring-1 ${tone}`}
            >
              {level}
              <span className="text-[10px] opacity-80">×{breakdown.byDifficulty[level] || 0}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
