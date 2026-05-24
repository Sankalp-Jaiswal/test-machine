"use client";

import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { Upload, ClipboardPaste, CheckCircle, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { parsePdfFile, parseDocxFile, extractQuestionsFromText } from "@/lib/fileParser";

export function ImportTest() {
  const router = useRouter();
  const [jsonInput, setJsonInput] = useState("");
  const [importedTest, setImportedTest] = useState<any>(null);
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [showTimeSelection, setShowTimeSelection] = useState(false);
  const addTestBank = useAppStore((state) => state.addTestBank);

  const handleJsonImport = async () => {
    try {
      setLoading(true);
      const parsed = JSON.parse(jsonInput);

      // Validate structure
      if (!parsed.testName || !parsed.duration || !Array.isArray(parsed.questions)) {
        throw new Error("Invalid format. Required fields: testName, duration, questions[]");
      }

      const test = {
        id: `test_${Date.now()}`,
        testName: parsed.testName,
        duration: parsed.duration,
        createdAt: Date.now(),
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

      setImportedTest(test);
      setSelectedDuration(test.duration);
      setShowTimeSelection(false);
      toast.success("Test parsed successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid JSON format");
      setImportedTest(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      let text = "";

      if (file.type === "application/pdf") {
        text = await parsePdfFile(file);
      } else if (
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.name.endsWith(".docx")
      ) {
        text = await parseDocxFile(file);
      } else if (file.type === "application/json" || file.name.endsWith(".json")) {
        text = await file.text();
      } else {
        throw new Error("Unsupported file format. Please use JSON, PDF, or DOCX.");
      }

      setJsonInput(text);
      toast.success("File loaded successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to read file");
    } finally {
      setLoading(false);
    }
  };

  const handleFileTypeUpload = (acceptedTypes: string) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => handleFileUpload(e);
  };

  const handleParsedImport = async (testData: any) => {
    try {
      setLoading(true);
      const test = {
        id: `test_${Date.now()}`,
        testName: testData.testName,
        duration: selectedDuration,
        createdAt: Date.now(),
        questions: testData.questions.map((q: any, idx: number) => ({
          id: q.id || idx + 1,
          section: q.section || "General",
          difficulty: q.difficulty || "medium",
          question: q.question,
          options: q.options || { A: "", B: "", C: "", D: "" },
          correctAnswer: q.correctAnswer || "A",
          explanation: q.explanation || "",
        })),
      };

      setImportedTest(test);
      setShowTimeSelection(true);
      toast.success("Questions extracted successfully!");
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
      let text = jsonInput;

      // Try to extract test name from JSON
      try {
        const parsed = JSON.parse(jsonInput);
        testName = parsed.testName || testName;
      } catch (_) {
        // Not JSON, continue with text
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
    <div className="w-full space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-4xl font-bold text-white mb-2">Import Test Bank</h1>
        <p className="text-muted-foreground">
          Upload JSON, PDF, or DOCX files • Supports formatted text with Q1, Q2... format
        </p>
      </motion.div>

      {!importedTest && !showTimeSelection ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* PDF Upload */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }}>
            <Card className="bg-card/50 border-border/30 backdrop-blur-sm p-8 cursor-pointer hover:border-primary/50 transition-all duration-300">
              <label className="flex flex-col items-center justify-center h-full cursor-pointer">
                <div className="p-3 bg-red-500/20 rounded-lg mb-4">
                  <Upload className="w-8 h-8 text-red-400" />
                </div>
                <p className="text-white font-semibold mb-1">Upload PDF</p>
                <p className="text-sm text-muted-foreground text-center mb-4">Click to select PDF file</p>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button className="bg-red-600 hover:bg-red-700 text-white">Select PDF</Button>
              </label>
            </Card>
          </motion.div>

          {/* DOCX Upload */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
            <Card className="bg-card/50 border-border/30 backdrop-blur-sm p-8 cursor-pointer hover:border-primary/50 transition-all duration-300">
              <label className="flex flex-col items-center justify-center h-full cursor-pointer">
                <div className="p-3 bg-blue-500/20 rounded-lg mb-4">
                  <Upload className="w-8 h-8 text-blue-400" />
                </div>
                <p className="text-white font-semibold mb-1">Upload DOCX</p>
                <p className="text-sm text-muted-foreground text-center mb-4">Click to select Word file</p>
                <input
                  type="file"
                  accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">Select DOCX</Button>
              </label>
            </Card>
          </motion.div>

          {/* JSON Upload */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}>
            <Card className="bg-card/50 border-border/30 backdrop-blur-sm p-8 cursor-pointer hover:border-primary/50 transition-all duration-300">
              <label className="flex flex-col items-center justify-center h-full cursor-pointer">
                <div className="p-3 bg-primary/20 rounded-lg mb-4">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <p className="text-white font-semibold mb-1">Upload JSON</p>
                <p className="text-sm text-muted-foreground text-center mb-4">Click to select JSON file</p>
                <input
                  type="file"
                  accept=".json"
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
          <Card className="bg-card/50 border-border/30 backdrop-blur-sm p-8">
            <p className="text-white font-semibold mb-4">Or Paste Content</p>
            <Textarea
              placeholder='Paste JSON, plain text with Q1, Q2... format, or PDF/DOCX text content'
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="h-48 bg-secondary/30 border-border/30 text-white placeholder:text-muted-foreground/50 mb-4 resize-none"
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
          <Card className="bg-card/50 border-border/30 backdrop-blur-sm p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{importedTest.testName}</h2>
                <p className="text-muted-foreground">{importedTest.questions.length} questions found</p>
              </div>
            </div>

            {/* Time Selection */}
            <div className="mb-6 p-6 bg-secondary/30 rounded-lg border border-border/30">
              <Label className="text-white mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Select Time Duration (minutes)
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
                  className="mt-2 bg-secondary/30 border-border/30"
                />
              </div>
            </div>

            {/* Questions Preview */}
            <div className="mb-6 max-h-96 overflow-auto">
              <h3 className="text-lg font-semibold text-white mb-4">Questions Preview</h3>
              <div className="space-y-3">
                {importedTest.questions.slice(0, 5).map((q: any, idx: number) => (
                  <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
                    <div className="p-3 bg-secondary/30 rounded-lg border border-border/30">
                      <p className="text-sm text-muted-foreground">
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
          <Card className="bg-card/50 border-border/30 backdrop-blur-sm p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{importedTest.testName}</h2>
                <p className="text-muted-foreground">{importedTest.questions.length} questions • {selectedDuration} minutes</p>
              </div>
            </div>

            {/* Questions Preview */}
            <div className="mb-6 max-h-96 overflow-auto">
              <h3 className="text-lg font-semibold text-white mb-4">Questions Preview</h3>
              <div className="space-y-3">
                {importedTest.questions.slice(0, 5).map((q: any, idx: number) => (
                  <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
                    <div className="p-3 bg-secondary/30 rounded-lg border border-border/30">
                      <p className="text-sm text-muted-foreground">Q{idx + 1}. {q.question.substring(0, 60)}...</p>
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
        <Card className="bg-card/50 border-border/30 backdrop-blur-sm p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Supported Formats</h3>
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-primary font-semibold mb-2">1. JSON Format (Full Control)</p>
              <pre className="bg-secondary/50 p-3 rounded-lg overflow-x-auto text-xs text-green-400">
                {`{
  "testName": "CIL Mock 1",
  "duration": 30,
  "questions": [
    {
      "id": 1,
      "section": "General",
      "difficulty": "easy",
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
            </div>

            <div>
              <p className="text-primary font-semibold mb-2">2. Text Format (Auto-Parse)</p>
              <pre className="bg-secondary/50 p-3 rounded-lg overflow-x-auto text-xs text-green-400">
                {`Q1. What is the capital of India?
A) New Delhi
B) Mumbai
C) Bangalore
D) Delhi
Ans: A
Exp: New Delhi is the capital

Q2. Next question...`}
              </pre>
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
