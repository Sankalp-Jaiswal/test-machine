"use client";

import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { Upload, Paste, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

export function ImportTest() {
  const router = useRouter();
  const [jsonInput, setJsonInput] = useState("");
  const [importedTest, setImportedTest] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const addTestBank = useAppStore((state) => state.addTestBank);

  const handleJsonImport = () => {
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
      toast.success("Test parsed successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid JSON format");
      setImportedTest(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        setJsonInput(content);
      } catch {
        toast.error("Failed to read file");
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (!importedTest) return;
    addTestBank(importedTest);
    toast.success("Test bank added successfully!");
    router.push("/");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-4xl font-bold text-white mb-2">Import Test Bank</h1>
        <p className="text-muted-foreground">Upload or paste JSON formatted question banks</p>
      </motion.div>

      {!importedTest ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* File Upload */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
            <Card className="bg-card/50 border-border/30 backdrop-blur-sm p-8 cursor-pointer hover:border-primary/50 transition-all duration-300">
              <label className="flex flex-col items-center justify-center h-full cursor-pointer">
                <div className="p-3 bg-primary/20 rounded-lg mb-4">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <p className="text-white font-semibold mb-1">Upload JSON File</p>
                <p className="text-sm text-muted-foreground text-center mb-4">Drag and drop or click to select</p>
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Select File</Button>
              </label>
            </Card>
          </motion.div>

          {/* JSON Paste */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
            <Card className="bg-card/50 border-border/30 backdrop-blur-sm p-8">
              <p className="text-white font-semibold mb-4">Or Paste JSON</p>
              <Textarea
                placeholder='{"testName":"CIL Mock 1","duration":30,"questions":[...]}'
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="h-48 bg-secondary/30 border-border/30 text-white placeholder:text-muted-foreground/50 mb-4 resize-none"
              />
              <Button onClick={handleJsonImport} disabled={!jsonInput || loading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                <Paste className="w-4 h-4" />
                {loading ? "Parsing..." : "Import Test"}
              </Button>
            </Card>
          </motion.div>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
          <Card className="bg-card/50 border-border/30 backdrop-blur-sm p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{importedTest.testName}</h2>
                <p className="text-muted-foreground">{importedTest.questions.length} questions • {importedTest.duration} minutes</p>
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
                {importedTest.questions.length > 5 && <p className="text-sm text-muted-foreground pt-2">+{importedTest.questions.length - 5} more questions</p>}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setImportedTest(null);
                  setJsonInput("");
                }}
                variant="outline"
                className="flex-1 border-border/30 hover:border-primary/50"
              >
                Cancel
              </Button>
              <Button onClick={handleConfirmImport} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                Confirm Import
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Template */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="bg-card/50 border-border/30 backdrop-blur-sm p-6">
          <h3 className="text-lg font-semibold text-white mb-4">JSON Format Template</h3>
          <pre className="bg-secondary/50 p-4 rounded-lg overflow-x-auto text-xs text-green-400 text-pretty">
            {`{
  "testName": "CIL Mock Set 1",
  "duration": 30,
  "questions": [
    {
      "id": 1,
      "section": "General Awareness",
      "difficulty": "easy",
      "question": "Your question here?",
      "options": {
        "A": "Option A",
        "B": "Option B",
        "C": "Option C",
        "D": "Option D"
      },
      "correctAnswer": "C",
      "explanation": "Explanation text..."
    }
  ]
}`}
          </pre>
        </Card>
      </motion.div>
    </div>
  );
}
