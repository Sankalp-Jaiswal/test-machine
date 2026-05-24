"use client";

import { useAppStore } from "@/store/useAppStore";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useRouter } from "next/navigation";
import {
  Trophy,
  Download,
  RotateCcw,
  Home,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Bookmark,
  ChevronDown,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import { generatePDFReport } from "@/lib/pdfGenerator";
import { useEffect, useMemo, useState } from "react";
import type { QuestionAttempt } from "@/types";

type ReviewFilter = "all" | "wrong" | "correct" | "skipped" | "marked";

function AnimatedNumber({
  to,
  suffix = "",
  duration = 1.4,
}: {
  to: number;
  suffix?: string;
  duration?: number;
}) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v).toString());
  const [val, setVal] = useState("0");
  useEffect(() => {
    const c = animate(mv, to, { duration, ease: [0.2, 0.8, 0.2, 1] });
    const u = rounded.on("change", setVal);
    return () => {
      c.stop();
      u();
    };
  }, [to, duration, mv, rounded]);
  return (
    <span>
      {val}
      {suffix}
    </span>
  );
}

function gradeColor(p: number) {
  if (p >= 75) return "text-success";
  if (p >= 50) return "text-warning";
  return "text-destructive";
}
function gradeLabel(p: number) {
  if (p >= 90) return "Outstanding";
  if (p >= 75) return "Strong";
  if (p >= 60) return "Solid";
  if (p >= 40) return "Building";
  return "Keep going";
}

export function ResultsScreen({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const results = useAppStore((s) => s.getTestResults());
  const result = results.find((r) => r.attemptId === attemptId);

  const [filter, setFilter] = useState<ReviewFilter>("wrong");
  const [openId, setOpenId] = useState<number | null>(null);

  if (!result) {
    return (
      <div className="flex items-center justify-center min-h-screen ambient-bg">
        <Card className="glass rounded-2xl p-8 border-border/60 text-center max-w-sm">
          <p className="text-foreground font-semibold mb-1">Result not found</p>
          <p className="text-muted-foreground text-sm mb-4">
            This attempt may have been cleared. Head back to the dashboard.
          </p>
          <Button onClick={() => router.push("/")} className="rounded-full">
            <Home className="w-4 h-4 mr-2" /> Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const scorePercentage = result.accuracy;
  const sectionData = Object.entries(result.sectionPerformance).map(([name, perf]) => ({
    name: name.length > 12 ? name.slice(0, 12) + "…" : name,
    fullName: name,
    correct: perf.correct,
    total: perf.total,
    percentage: Math.round((perf.correct / perf.total) * 100),
  }));

  const difficultyColorMap: Record<string, { fill: string; swatch: string }> = {
    EASY: { fill: "hsl(152 76% 50%)", swatch: "bg-success" },
    MEDIUM: { fill: "hsl(38 95% 60%)", swatch: "bg-warning" },
    HARD: { fill: "hsl(0 84% 60%)", swatch: "bg-destructive" },
  };
  const defaultDifficultyColor = { fill: "hsl(252 87% 67%)", swatch: "bg-primary" };

  const difficultyData = Object.entries(result.difficultyPerformance).map(([name, perf]) => {
    const upper = name.toUpperCase();
    return {
      name: upper,
      value: Math.round((perf.correct / perf.total) * 100),
      fill: (difficultyColorMap[upper] ?? defaultDifficultyColor).fill,
      swatch: (difficultyColorMap[upper] ?? defaultDifficultyColor).swatch,
    };
  });

  const attempts: QuestionAttempt[] = result.questionAttempts ?? [];
  const counts = useMemo(
    () => ({
      all: attempts.length,
      wrong: attempts.filter((a) => !a.isCorrect && !a.isSkipped).length,
      correct: attempts.filter((a) => a.isCorrect).length,
      skipped: attempts.filter((a) => a.isSkipped).length,
      marked: attempts.filter((a) => a.isMarked).length,
    }),
    [attempts],
  );

  const filteredAttempts = useMemo(() => {
    switch (filter) {
      case "wrong":
        return attempts.filter((a) => !a.isCorrect && !a.isSkipped);
      case "correct":
        return attempts.filter((a) => a.isCorrect);
      case "skipped":
        return attempts.filter((a) => a.isSkipped);
      case "marked":
        return attempts.filter((a) => a.isMarked);
      default:
        return attempts;
    }
  }, [filter, attempts]);

  const motivational = (() => {
    if (scorePercentage >= 90) return "Brilliant. You're crushing the syllabus — keep pushing on harder difficulty.";
    if (scorePercentage >= 75) return "Strong attempt. Drill the weak sections below to lock in mastery.";
    if (scorePercentage >= 50) return "Solid foundation. Focus on the wrong answers below — that's where the gains are.";
    return "Every wrong answer is a free lesson. Review each one — you'll bounce back quickly.";
  })();

  return (
    <div className="min-h-screen ambient-bg bg-background">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-10 lg:py-14 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-start justify-between flex-wrap gap-4"
        >
          <div>
            <div className="inline-flex items-center gap-2 mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              Result · {new Date(result.completedAt).toLocaleString()}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              {result.testName}
            </h1>
            <p className="text-muted-foreground mt-2 max-w-xl">{motivational}</p>
          </div>
          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="rounded-full border-border/60 gap-2"
          >
            <Home className="w-4 h-4" /> Dashboard
          </Button>
        </motion.div>

        {/* Score hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="glass rounded-3xl border-border/60 p-8 md:p-10 relative overflow-hidden">
            <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-accent/15 blur-3xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative">
              {/* Score ring */}
              <div className="flex justify-center">
                <div className="relative w-52 h-52 grid place-items-center">
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
                    <defs>
                      <linearGradient id="hero-grad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="hsl(252 87% 67%)" />
                        <stop offset="100%" stopColor="hsl(187 92% 60%)" />
                      </linearGradient>
                    </defs>
                    <circle cx="100" cy="100" r="88" fill="none" stroke="hsl(240 6% 14%)" strokeWidth="10" />
                    <motion.circle
                      cx="100"
                      cy="100"
                      r="88"
                      fill="none"
                      stroke="url(#hero-grad)"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 88}
                      initial={{ strokeDashoffset: 2 * Math.PI * 88 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 88 * (1 - scorePercentage / 100) }}
                      transition={{ duration: 1.6, ease: [0.2, 0.8, 0.2, 1] }}
                      style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
                    />
                  </svg>
                  <div className="text-center">
                    <p className={`text-6xl font-bold tabular-nums ${gradeColor(scorePercentage)}`}>
                      <AnimatedNumber to={scorePercentage} />
                    </p>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mt-1">
                      Accuracy
                    </p>
                    <p className="text-xs text-foreground/80 mt-2 font-medium">
                      {gradeLabel(scorePercentage)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-5">
                <div className="grid grid-cols-3 gap-3">
                  <SummaryStat
                    icon={CheckCircle2}
                    label="Correct"
                    value={result.correctAnswers}
                    color="text-success bg-success/10 ring-success/30"
                  />
                  <SummaryStat
                    icon={XCircle}
                    label="Wrong"
                    value={result.wrongAnswers}
                    color="text-destructive bg-destructive/10 ring-destructive/30"
                  />
                  <SummaryStat
                    icon={MinusCircle}
                    label="Skipped"
                    value={result.skipped}
                    color="text-warning bg-warning/10 ring-warning/30"
                  />
                </div>
                <div className="pt-4 border-t border-border/60 grid grid-cols-2 gap-3 text-sm">
                  <Row label="Total questions" value={String(result.totalQuestions)} />
                  <Row
                    label="Time taken"
                    value={`${Math.floor(result.timeTaken / 60)}m ${result.timeTaken % 60}s`}
                  />
                  <Row label="Avg per question" value={`${Math.round(result.timeTaken / Math.max(1, result.totalQuestions))}s`} />
                  <Row
                    label="Attempt rate"
                    value={`${Math.round(((result.totalQuestions - result.skipped) / result.totalQuestions) * 100)}%`}
                  />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="glass rounded-2xl p-6 border-border/60">
              <h3 className="text-base font-semibold text-foreground mb-4">
                Section-wise performance
              </h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={sectionData}>
                  <defs>
                    <linearGradient id="res-bar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(252 87% 67%)" />
                      <stop offset="100%" stopColor="hsl(252 87% 35%)" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 6" stroke="hsl(240 6% 18%)" />
                  <XAxis dataKey="name" stroke="hsl(240 5% 55%)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(240 5% 55%)" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip
                    cursor={{ fill: "hsl(252 87% 67% / 0.08)" }}
                    contentStyle={{
                      backgroundColor: "hsl(240 8% 8%)",
                      border: "1px solid hsl(240 6% 18%)",
                      borderRadius: 10,
                      fontSize: 12,
                    }}
                    labelFormatter={(label, payload) =>
                      payload?.[0]?.payload?.fullName ?? label
                    }
                  />
                  <Bar dataKey="percentage" fill="url(#res-bar)" radius={[10, 10, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass rounded-2xl p-6 border-border/60">
              <h3 className="text-base font-semibold text-foreground mb-4">
                Difficulty mastery
              </h3>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={difficultyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="hsl(240 10% 3%)"
                  >
                    {difficultyData.map((d) => (
                      <Cell key={d.name} fill={d.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(240 8% 8%)",
                      border: "1px solid hsl(240 6% 18%)",
                      borderRadius: 10,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 justify-center mt-2">
                {difficultyData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className={`w-2.5 h-2.5 rounded-full ${d.swatch}`} />
                    {d.name} · <span className="text-foreground font-semibold">{d.value}%</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Detailed section breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="glass rounded-2xl p-6 border-border/60">
            <h3 className="text-base font-semibold text-foreground mb-4">
              Section breakdown
            </h3>
            <div className="space-y-3">
              {sectionData.map((section, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + idx * 0.04 }}
                  className="rounded-xl p-4 bg-white/2 border border-border/60"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{section.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {section.correct} correct of {section.total}
                      </p>
                    </div>
                    <p className={`text-lg font-bold tabular-nums ${gradeColor(section.percentage)}`}>
                      {section.percentage}%
                    </p>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary/60 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${section.percentage}%` }}
                      transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1], delay: 0.3 + idx * 0.05 }}
                      className="h-full gradient-brand"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Question Review (the explicit ask) */}
        {attempts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass rounded-2xl border-border/60 p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    Question review
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Browse every question to see what you picked vs the correct answer.
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 p-1 rounded-full glass">
                  {([
                    { key: "wrong", label: "Wrong", count: counts.wrong, color: "text-destructive" },
                    { key: "correct", label: "Correct", count: counts.correct, color: "text-success" },
                    { key: "skipped", label: "Skipped", count: counts.skipped, color: "text-warning" },
                    { key: "marked", label: "Marked", count: counts.marked, color: "text-accent" },
                    { key: "all", label: "All", count: counts.all, color: "text-foreground" },
                  ] as { key: ReviewFilter; label: string; count: number; color: string }[]).map((tab) => {
                    const active = filter === tab.key;
                    return (
                      <button
                        type="button"
                        key={tab.key}
                        onClick={() => setFilter(tab.key)}
                        className={`relative px-3 py-1.5 rounded-full text-xs font-medium transition-colors ring-focus ${
                          active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId="review-tab-pill"
                            className="absolute inset-0 rounded-full bg-primary/20 ring-1 ring-primary/40"
                            transition={{ type: "spring", stiffness: 380, damping: 32 }}
                          />
                        )}
                        <span className="relative inline-flex items-center gap-1.5">
                          {tab.label}
                          <span className={`tabular-nums text-[10px] ${active ? tab.color : "text-muted-foreground"}`}>
                            {tab.count}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {filteredAttempts.length === 0 ? (
                <div className="text-center py-10 text-sm text-muted-foreground">
                  Nothing here — try a different filter.
                </div>
              ) : (
                <ul className="space-y-3">
                  {filteredAttempts.map((qa, displayIdx) => (
                    <QuestionReviewRow
                      key={qa.questionId}
                      qa={qa}
                      idx={attempts.findIndex((x) => x.questionId === qa.questionId)}
                      displayIdx={displayIdx}
                      open={openId === qa.questionId}
                      onToggle={() =>
                        setOpenId(openId === qa.questionId ? null : qa.questionId)
                      }
                    />
                  ))}
                </ul>
              )}
            </Card>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <Button
            onClick={() => generatePDFReport(result)}
            className="flex-1 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            <Download className="w-4 h-4" /> Download PDF report
          </Button>
          <Button
            onClick={() => router.push(`/test/${result.testId}`)}
            variant="outline"
            className="flex-1 rounded-full border-border/60 gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Retake test
          </Button>
          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="flex-1 rounded-full border-border/60 gap-2"
          >
            <Trophy className="w-4 h-4" /> All attempts
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function SummaryStat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className={`rounded-xl p-4 ring-1 ${color}`}>
      <Icon className="w-5 h-5 mb-2 opacity-80" />
      <p className="text-2xl font-bold tabular-nums">
        <AnimatedNumber to={value} />
      </p>
      <p className="text-[11px] uppercase tracking-[0.14em] opacity-80 mt-1">
        {label}
      </p>
    </div>
  );
}

function QuestionReviewRow({
  qa,
  idx,
  displayIdx,
  open,
  onToggle,
}: {
  qa: QuestionAttempt;
  idx: number;
  displayIdx: number;
  open: boolean;
  onToggle: () => void;
}) {
  const statusMeta = qa.isSkipped
    ? { label: "Skipped", Icon: MinusCircle, color: "text-warning", ring: "ring-warning/40", bg: "bg-warning/10" }
    : qa.isCorrect
    ? { label: "Correct", Icon: CheckCircle2, color: "text-success", ring: "ring-success/40", bg: "bg-success/10" }
    : { label: "Wrong", Icon: XCircle, color: "text-destructive", ring: "ring-destructive/40", bg: "bg-destructive/10" };

  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(0.02 * displayIdx, 0.3) }}
      className="rounded-2xl border border-border/60 overflow-hidden bg-white/2"
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left p-4 md:p-5 flex items-start gap-4 hover:bg-white/2.5 transition-colors ring-focus"
      >
        <div className={`shrink-0 w-10 h-10 rounded-xl grid place-items-center ring-1 ${statusMeta.bg} ${statusMeta.ring}`}>
          <statusMeta.Icon className={`w-5 h-5 ${statusMeta.color}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-medium text-muted-foreground tabular-nums">
              Q{idx + 1}
            </span>
            <span className="text-[10px] uppercase tracking-[0.14em] font-semibold text-primary/90 bg-primary/10 ring-1 ring-primary/30 rounded-full px-2 py-0.5">
              {qa.section}
            </span>
            <span
              className={`text-[10px] uppercase tracking-[0.14em] font-semibold rounded-full px-2 py-0.5 ring-1 ${
                qa.difficulty === "easy"
                  ? "text-success bg-success/10 ring-success/30"
                  : qa.difficulty === "medium"
                  ? "text-warning bg-warning/10 ring-warning/30"
                  : "text-destructive bg-destructive/10 ring-destructive/30"
              }`}
            >
              {qa.difficulty}
            </span>
            {qa.isMarked && (
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] font-semibold text-accent bg-accent/10 ring-1 ring-accent/30 rounded-full px-2 py-0.5">
                <Bookmark className="w-3 h-3" /> Marked
              </span>
            )}
            <span className={`ml-auto text-[11px] font-medium ${statusMeta.color}`}>
              {statusMeta.label}
            </span>
          </div>
          <p className="text-sm md:text-[15px] font-medium text-foreground leading-snug pr-6">
            {qa.question}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Your answer:{" "}
            <span className={`font-semibold ${qa.isSkipped ? "text-warning" : qa.isCorrect ? "text-success" : "text-destructive"}`}>
              {qa.userAnswer ?? "—"}
            </span>{" "}
            · Correct:{" "}
            <span className="text-success font-semibold">{qa.correctAnswer}</span>
          </p>
        </div>
        <ChevronDown
          className={`shrink-0 w-4 h-4 text-muted-foreground mt-1 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 md:px-5 pb-5 pt-1 space-y-2 border-t border-border/60">
              {(["A", "B", "C", "D"] as const).map((k) => {
                const isCorrect = qa.correctAnswer === k;
                const isUser = qa.userAnswer === k;
                const tone = isCorrect
                  ? "border-success/50 bg-success/8 text-foreground"
                  : isUser
                  ? "border-destructive/50 bg-destructive/8 text-foreground"
                  : "border-border/60 bg-secondary/30 text-foreground/80";
                return (
                  <div
                    key={k}
                    className={`flex items-start gap-3 p-3 rounded-xl border ${tone}`}
                  >
                    <div
                      className={`shrink-0 w-7 h-7 rounded-lg grid place-items-center text-xs font-semibold ${
                        isCorrect
                          ? "bg-success/20 text-success"
                          : isUser
                          ? "bg-destructive/20 text-destructive"
                          : "bg-background/80 text-muted-foreground ring-1 ring-border/70"
                      }`}
                    >
                      {k}
                    </div>
                    <p className="flex-1 text-sm leading-relaxed">{qa.options[k]}</p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isCorrect && (
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-success">
                          Correct
                        </span>
                      )}
                      {isUser && !isCorrect && (
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-destructive">
                          Your pick
                        </span>
                      )}
                      {isUser && isCorrect && (
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-success">
                          Your pick
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {qa.explanation && (
                <div className="mt-3 flex gap-3 p-4 rounded-xl bg-primary/8 border border-primary/30">
                  <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.14em] font-semibold text-primary mb-1">
                      Explanation
                    </p>
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      {qa.explanation}
                    </p>
                  </div>
                </div>
              )}

              {qa.timeSpent > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Time spent on this question:{" "}
                  <span className="text-foreground font-semibold">{qa.timeSpent}s</span>
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}
