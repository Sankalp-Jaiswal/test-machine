"use client";

import { useAppStore } from "@/store/useAppStore";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import { Clock, BookmarkX, Bookmark } from "lucide-react";
import toast from "react-hot-toast";

const TOASTER = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <div className="fixed top-4 right-4 z-50">
      <div id="toast-container" />
    </div>
  );
};

export function TestEngine({ testId }: { testId: string }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);

  const currentAttempt = useAppStore((state) => state.currentAttempt);
  const getCurrentTest = useAppStore((state) => state.getCurrentTest);
  const updateAnswers = useAppStore((state) => state.updateAnswers);
  const toggleMark = useAppStore((state) => state.toggleMarkForReview);
  const endTest = useAppStore((state) => state.endTest);
  const startTest = useAppStore((state) => state.startTest);

  useEffect(() => {
    setMounted(true);
    startTest(testId);
  }, [testId, startTest]);

  const test = getCurrentTest();
  const question = test?.questions[currentQuestionIdx];
  const currentAnswer = currentAttempt?.answers[question?.id || 0] || null;
  const isMarked = currentAttempt?.markedForReview.has(question?.id || 0);

  useEffect(() => {
    if (!test || !mounted) return;
    const totalSeconds = test.duration * 60;
    setTimeLeft(totalSeconds);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [test, mounted]);

  const handleSubmit = () => {
    if (!currentAttempt || !test) return;
    endTest(currentAttempt.answers, currentAttempt.timePerQuestion);
    router.push(`/results/${currentAttempt.id}`);
  };

  const handleAnswerChange = (option: "A" | "B" | "C" | "D") => {
    if (!question) return;
    updateAnswers(question.id, currentAnswer === option ? null : option);
  };

  if (!mounted || !test || !question || !currentAttempt) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading test...</p>
      </div>
    );
  }

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const isTimeWarning = timeLeft < 300;

  const answeredCount = Object.values(currentAttempt.answers).filter((a) => a !== null).length;
  const markedCount = currentAttempt.markedForReview.size;

  return (
    <>
      <TOASTER />
      <div className="flex h-screen bg-background">
        {/* Left Panel - Question */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-3xl mx-auto p-6 lg:p-8">
            {/* Timer */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
              <div className={`flex items-center gap-2 text-lg font-bold ${isTimeWarning ? "text-red-500" : "text-primary"}`}>
                <Clock className="w-5 h-5" />
                {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
              </div>
            </motion.div>

            {/* Question */}
            <motion.div key={question.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
              <Card className="bg-card/50 border-border/30 backdrop-blur-sm p-6 lg:p-8 mb-8">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="inline-block px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-semibold mb-3">{question.section}</div>
                    <h2 className="text-2xl font-bold text-white mb-2">Q{currentQuestionIdx + 1}. {question.question}</h2>
                    <p className="text-xs text-muted-foreground">
                      Difficulty: <span className="capitalize text-accent">{question.difficulty}</span>
                    </p>
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-3 mt-6">
                  {Object.entries(question.options).map(([key, value]) => (
                    <motion.button
                      key={key}
                      onClick={() => handleAnswerChange(key as "A" | "B" | "C" | "D")}
                      className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                        currentAnswer === key ? "border-primary bg-primary/10" : "border-border/30 bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50"
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            currentAnswer === key ? "border-primary bg-primary" : "border-muted"
                          }`}
                        >
                          {currentAnswer === key && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <span className="font-medium text-white">
                          {key}. {value}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-3 mb-8">
                <Button
                  onClick={() => toggleMark(question.id)}
                  variant="outline"
                  className="border-border/30 hover:border-primary/50 gap-2"
                >
                  {isMarked ? <BookmarkX className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                  {isMarked ? "Unmark" : "Mark for Review"}
                </Button>
              </div>

              {/* Navigation */}
              <div className="flex gap-3">
                <Button
                  onClick={() => setCurrentQuestionIdx(Math.max(0, currentQuestionIdx - 1))}
                  disabled={currentQuestionIdx === 0}
                  variant="outline"
                  className="border-border/30 hover:border-primary/50"
                >
                  Previous
                </Button>

                {currentQuestionIdx === test.questions.length - 1 ? (
                  <Button onClick={() => setShowConfirm(true)} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                    Submit Test
                  </Button>
                ) : (
                  <Button onClick={() => setCurrentQuestionIdx(currentQuestionIdx + 1)} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                    Next
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right Panel - Question Palette */}
        <div className="hidden lg:block w-64 bg-card/50 border-l border-border/30 backdrop-blur-sm p-4 overflow-auto">
          <div className="sticky top-0">
            <h3 className="text-sm font-semibold text-white mb-4">Questions ({answeredCount}/{test.questions.length})</h3>

            <div className="grid grid-cols-5 gap-2 mb-6">
              {test.questions.map((q, idx) => {
                const isAnswered = currentAttempt.answers[q.id] !== null;
                const isCurrent = idx === currentQuestionIdx;
                const isReviewMarked = currentAttempt.markedForReview.has(q.id);

                return (
                  <motion.button
                    key={q.id}
                    onClick={() => setCurrentQuestionIdx(idx)}
                    className={`aspect-square rounded-lg font-semibold text-xs transition-all duration-200 ${
                      isCurrent ? "bg-primary text-primary-foreground border-2 border-primary" : isReviewMarked ? "bg-accent/20 border border-accent text-accent" : isAnswered ? "bg-green-500/20 border border-green-500 text-green-400" : "bg-secondary/30 border border-border/30 text-muted-foreground hover:border-primary/50"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {idx + 1}
                  </motion.button>
                );
              })}
            </div>

            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded" />
                Current
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded" />
                Answered
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-accent rounded" />
                Marked
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="bg-card/95 border-border/30 backdrop-blur-sm">
          <AlertDialogTitle className="text-white">Submit Test?</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            You have answered {answeredCount} out of {test.questions.length} questions. Are you sure you want to submit?
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end mt-6">
            <AlertDialogCancel className="border-border/30 hover:bg-secondary/30">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Submit
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
