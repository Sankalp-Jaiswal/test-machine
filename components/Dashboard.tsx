"use client";

import { useAppStore } from "@/store/useAppStore";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Clock,
  Sparkles,
  ArrowUpRight,
  Play,
  Eye,
  Target,
  Database,
  Upload,
  Layers,
  Gauge,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { TestResult } from "@/types";

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  delta,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  suffix?: string;
  delta?: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="bg-card rounded-xl p-5 border border-border/75 hover:shadow-xs transition-all duration-200 relative overflow-hidden flex flex-col justify-between h-full min-h-[110px]">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5 flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/90 font-mono">
              {label}
            </p>
            <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums truncate">
              {value}
              {suffix}
            </p>
          </div>
          <div className="p-2 bg-secondary/80 border border-border/40 text-primary rounded-lg shrink-0 ml-3">
            <Icon className="w-4 h-4" />
          </div>
        </div>
        {delta && (
          <p className="text-[11px] text-muted-foreground/80 flex items-center gap-1 mt-2">
            <TrendingUp className="w-3.5 h-3.5 text-success" />
            {delta}
          </p>
        )}
      </Card>
    </motion.div>
  );
}

function EmptyImportState() {
  const router = useRouter();
  return (
    <Card className="bg-card rounded-xl p-10 text-center border border-border/75 shadow-xs max-w-xl mx-auto">
      <div className="mx-auto w-12 h-12 rounded-xl bg-secondary/80 border border-border/60 flex items-center justify-center mb-4">
        <Upload className="w-5 h-5 text-primary" />
      </div>
      <h3 className="text-base font-semibold text-foreground">Your question bank is empty</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1.5 leading-relaxed">
        Import a JSON, PDF, or DOCX file with questions. Once imported, questions are automatically grouped
        by section and difficulty, and become ready for practice.
      </p>
      <Button
        onClick={() => router.push("/settings")}
        className="rounded-lg mt-5 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold gap-2 px-4 py-2"
      >
        <Upload className="w-3.5 h-3.5" /> Import questions
      </Button>
    </Card>
  );
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "hsl(142 72% 29%)",     /* Green */
  medium: "hsl(38 92% 50%)",    /* Amber */
  hard: "hsl(0 84% 60%)",       /* Red */
};

const DIFFICULTY_SWATCH_CLASS: Record<string, string> = {
  EASY: "bg-success",
  MEDIUM: "bg-warning",
  HARD: "bg-destructive",
};

export function Dashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({
    totalTests: 0,
    avgAccuracy: 0,
    totalTime: 0,
  });
  const [poolStats, setPoolStats] = useState({
    totalQuestions: 0,
    totalSections: 0,
    totalImports: 0,
    bySection: {} as Record<string, number>,
    byDifficulty: { easy: 0, medium: 0, hard: 0 } as Record<"easy" | "medium" | "hard", number>,
  });
  const [results, setResults] = useState<TestResult[]>([]);

  useEffect(() => {
    setMounted(true);
    const s = useAppStore.getState();
    setStats(s.getDashboardStats());
    setResults(s.getTestResults());
    setPoolStats(s.getQuestionPoolStats());

    const unsub = useAppStore.subscribe((state) => {
      setStats(state.getDashboardStats());
      setResults(state.getTestResults());
      setPoolStats(state.getQuestionPoolStats());
    });
    return () => unsub();
  }, []);

  const accuracyData = useMemo(
    () =>
      results
        .slice(-10)
        .map((r, idx) => ({ name: `T${idx + 1}`, accuracy: r.accuracy })),
    [results],
  );

  const sectionData = useMemo(
    () =>
      Object.entries(poolStats.bySection)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, count]) => ({
          name: name.length > 12 ? name.slice(0, 12) + "…" : name,
          fullName: name,
          count,
        })),
    [poolStats.bySection],
  );

  const difficultyData = useMemo(
    () =>
      (["easy", "medium", "hard"] as const)
        .filter((d) => poolStats.byDifficulty[d] > 0)
        .map((d) => ({
          name: d.toUpperCase(),
          value: poolStats.byDifficulty[d],
          fill: DIFFICULTY_COLORS[d],
        })),
    [poolStats.byDifficulty],
  );

  // Dynamic computation of section question counts and difficulty breakdowns
  const sectionBreakdown = useMemo(() => {
    const s = useAppStore.getState();
    const banks = s.testBanks.filter((b) => !b.id.startsWith("pooled_"));
    const allQuestions = banks.flatMap((b) => b.questions);

    const breakdown: Record<string, { total: number; easy: number; medium: number; hard: number }> = {};
    allQuestions.forEach((q) => {
      if (!breakdown[q.section]) {
        breakdown[q.section] = { total: 0, easy: 0, medium: 0, hard: 0 };
      }
      breakdown[q.section].total++;
      if (q.difficulty === "easy") breakdown[q.section].easy++;
      else if (q.difficulty === "medium") breakdown[q.section].medium++;
      else if (q.difficulty === "hard") breakdown[q.section].hard++;
    });

    return Object.entries(breakdown)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [poolStats.totalQuestions]);

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton-shimmer rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 skeleton-shimmer rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const hasPool = poolStats.totalQuestions > 0;

  return (
    <div className="ambient-bg space-y-8">
      {/* Hero Header */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary border border-border/50 text-[10px] font-semibold text-muted-foreground uppercase font-mono">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-success/60 animate-ping" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success" />
              </span>
              Workspace Ready
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Your question workspace
            </h1>
            <p className="text-muted-foreground text-sm max-w-xl leading-relaxed">
              All imported questions live in one centralized pool. Build custom practice sessions or evaluate your progress instantly.
            </p>
          </div>
          <div className="flex gap-2.5 flex-wrap shrink-0">
            <Button
              onClick={() => router.push("/settings")}
              variant="outline"
              className="rounded-lg border-border/80 hover:bg-secondary/60 hover:text-foreground text-xs font-semibold gap-1.5 h-9 px-4"
            >
              <Upload className="w-3.5 h-3.5 text-muted-foreground" /> Import Set
            </Button>
            <Button
              onClick={() => router.push("/practice")}
              disabled={!hasPool}
              className="rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold gap-1.5 h-9 px-4 disabled:opacity-50 disabled:pointer-events-none shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Start Practice
            </Button>
          </div>
        </div>
      </motion.section>

      {/* Pool stats widgets */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Database}
          label="Total pool questions"
          value={poolStats.totalQuestions}
          delay={0.04}
          delta={poolStats.totalImports ? `${poolStats.totalImports} file import${poolStats.totalImports === 1 ? "" : "s"}` : undefined}
        />
        <StatCard
          icon={Layers}
          label="Available sections"
          value={poolStats.totalSections}
          delay={0.08}
        />
        <StatCard
          icon={Gauge}
          label="Difficulty mix"
          value={`${poolStats.byDifficulty.easy} / ${poolStats.byDifficulty.medium} / ${poolStats.byDifficulty.hard}`}
          delay={0.12}
          delta="easy / med / hard"
        />
        <StatCard
          icon={Target}
          label="Total attempts"
          value={stats.totalTests}
          delay={0.16}
          delta={stats.avgAccuracy ? `${stats.avgAccuracy}% avg accuracy` : undefined}
        />
      </section>

      {/* Category grid counts (Strict visual redesign for multiple categories breakdown) */}
      {hasPool && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="space-y-4"
        >
          <div>
            <h3 className="text-base font-semibold text-foreground">Categories & Pool Mix</h3>
            <p className="text-xs text-muted-foreground">Scannable distribution of questions and difficulty levels per section.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {sectionBreakdown.map((sec, idx) => {
              const easyPercent = Math.max(2, Math.round((sec.easy / sec.total) * 100));
              const mediumPercent = Math.max(2, Math.round((sec.medium / sec.total) * 100));
              const hardPercent = Math.max(2, Math.round((sec.hard / sec.total) * 100));
              return (
                <motion.div
                  key={sec.name}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + idx * 0.02, duration: 0.35 }}
                  className="bg-card rounded-xl p-4 border border-border/80 hover:border-primary/20 hover:shadow-xs transition-all duration-200 group relative flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate" title={sec.name}>
                        {sec.name}
                      </p>
                      <span className="text-[10px] font-semibold bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full shrink-0">
                        {sec.total} Qs
                      </span>
                    </div>

                    {/* Stacked micro progress bar */}
                    <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden flex">
                      {sec.easy > 0 && (
                        <div 
                          className="h-full bg-success" 
                          style={{ width: `${easyPercent}%` }} 
                          title={`Easy: ${sec.easy}`}
                        />
                      )}
                      {sec.medium > 0 && (
                        <div 
                          className="h-full bg-warning" 
                          style={{ width: `${mediumPercent}%` }} 
                          title={`Medium: ${sec.medium}`}
                        />
                      )}
                      {sec.hard > 0 && (
                        <div 
                          className="h-full bg-destructive" 
                          style={{ width: `${hardPercent}%` }} 
                          title={`Hard: ${sec.hard}`}
                        />
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground/80 pt-1">
                    <div className="flex gap-2">
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />{sec.easy} e</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-warning shrink-0" />{sec.medium} m</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />{sec.hard} h</span>
                    </div>
                    <button 
                      onClick={() => router.push(`/practice?section=${encodeURIComponent(sec.name)}`)}
                      className="opacity-0 group-hover:opacity-100 text-primary font-semibold flex items-center gap-0.5 transition-all duration-200 cursor-pointer"
                    >
                      Practice →
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* Pool visual / attempts charts */}
      {!hasPool ? (
        <EmptyImportState />
      ) : (
        <>
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bar Chart Section */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="lg:col-span-2"
            >
              <Card className="bg-card rounded-xl p-5 border border-border/80 shadow-xs">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Questions per Section</h3>
                    <p className="text-xs text-muted-foreground">
                      Top {sectionData.length} sections in the active workspace
                    </p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={sectionData}>
                    <CartesianGrid strokeDasharray="3 4" stroke="rgba(0,0,0,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#888888" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke="#888888" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                      allowDecimals={false} 
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(0, 0, 0, 0.02)" }}
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                        fontSize: 12,
                        boxShadow: "0 4px 12px -2px rgba(0, 0, 0, 0.05)",
                      }}
                      labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName ?? label}
                    />
                    <Bar dataKey="count" fill="rgba(15, 23, 42, 0.9)" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </motion.div>

            {/* Pie Chart Section */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-card rounded-xl p-5 border border-border/80 shadow-xs h-full flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Difficulty Split</h3>
                  <p className="text-xs text-muted-foreground">Workspace pool mix breakdown</p>
                </div>
                {difficultyData.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center py-6 text-xs text-muted-foreground">No difficulty data.</div>
                ) : (
                  <div className="py-4">
                    <ResponsiveContainer width="100%" height={170}>
                      <PieChart>
                        <Pie
                          data={difficultyData}
                          cx="50%"
                          cy="50%"
                          innerRadius={48}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {difficultyData.map((d) => (
                            <Cell key={d.name} fill={d.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#ffffff",
                            border: "1px solid #e5e7eb",
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col gap-2 mt-4 border-t border-border/50 pt-3">
                      {difficultyData.map((d) => (
                        <div key={d.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${DIFFICULTY_SWATCH_CLASS[d.name] ?? "bg-primary"}`}
                            />
                            <span className="text-muted-foreground">{d.name}</span>
                          </div>
                          <span className="text-foreground font-semibold tabular-nums">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          </section>

          {/* Accuracy trend + recent attempts */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Line Chart Section */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="lg:col-span-1"
            >
              <Card className="bg-card rounded-xl p-5 border border-border/80 shadow-xs h-full flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Accuracy Trend</h3>
                    <p className="text-xs text-muted-foreground">
                      Last {accuracyData.length} attempt{accuracyData.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground bg-secondary/80 border border-border/40 px-2.5 py-0.5 rounded-full">
                    Avg: <span className="text-foreground font-semibold">{stats.avgAccuracy}%</span>
                  </div>
                </div>
                {accuracyData.length === 0 ? (
                  <div className="flex-1 min-h-[160px] grid place-items-center text-xs text-muted-foreground">
                    No attempts yet
                  </div>
                ) : (
                  <div className="py-2 flex-1 flex items-center">
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart data={accuracyData}>
                        <CartesianGrid strokeDasharray="3 4" stroke="rgba(0,0,0,0.05)" vertical={false} />
                        <XAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} dataKey="name" />
                        <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#ffffff",
                            border: "1px solid #e5e7eb",
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="accuracy"
                          stroke="rgba(15, 23, 42, 0.9)"
                          strokeWidth={2}
                          dot={{ fill: "rgba(15, 23, 42, 0.9)", strokeWidth: 0, r: 3 }}
                          activeDot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>
            </motion.div>

            {/* Recent Attempts list */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-2"
            >
              <Card className="bg-card rounded-xl p-5 border border-border/80 shadow-xs h-full flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Recent Attempts</h3>
                    <p className="text-xs text-muted-foreground">Select an attempt to review the detailed report</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-foreground gap-1 hover:bg-secondary/60 cursor-pointer px-2.5"
                    onClick={() => router.push("/profile")}
                  >
                    All Attempts <ArrowUpRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {results.length === 0 ? (
                  <div className="text-center py-8 flex-1 flex flex-col items-center justify-center">
                    <Sparkles className="w-6 h-6 text-muted-foreground/45 mb-2 animate-pulse" />
                    <p className="text-xs text-foreground font-medium">No attempts recorded yet</p>
                    <p className="text-[11px] text-muted-foreground mt-1 mb-4 max-w-[240px]">
                      Complete a practice session to view diagnostic metrics here.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => router.push("/practice")}
                      className="rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold gap-1.5 h-8 px-3.5 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" /> Start Practice
                    </Button>
                  </div>
                ) : (
                  <ul className="divide-y divide-border/60 flex-1 overflow-auto">
                    {results
                      .slice()
                      .reverse()
                      .slice(0, 5)
                      .map((r) => {
                        const grade =
                          r.accuracy >= 75
                            ? "text-success bg-success/10"
                            : r.accuracy >= 50
                            ? "text-warning bg-warning/10"
                            : "text-destructive bg-destructive/10";
                        return (
                          <li key={r.attemptId}>
                            <button
                              type="button"
                              onClick={() => router.push(`/results/${r.attemptId}`)}
                              className="w-full flex items-center justify-between gap-4 py-2.5 px-2 -mx-2 rounded-lg hover:bg-secondary/50 transition-colors group ring-focus text-left cursor-pointer"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{r.testName}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {new Date(r.completedAt).toLocaleString()} · {r.correctAnswers}/{r.totalQuestions} correct
                                </p>
                              </div>
                              <div className="flex items-center gap-3.5 shrink-0 ml-2">
                                <span className={`text-xs font-bold tabular-nums px-2 py-0.5 rounded-full shrink-0 ${grade}`}>
                                  {r.accuracy}%
                                </span>
                                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted-foreground group-hover:text-foreground transition-colors">
                                  <Eye className="w-3.5 h-3.5" /> Review
                                </span>
                              </div>
                            </button>
                          </li>
                        );
                      })}
                  </ul>
                )}
              </Card>
            </motion.div>
          </section>
        </>
      )}
    </div>
  );
}
