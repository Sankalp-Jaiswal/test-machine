"use client";

import { useAppStore } from "@/store/useAppStore";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
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
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Clock,
  BookOpen,
  Sparkles,
  ArrowUpRight,
  Play,
  Eye,
  Target,
  Flame,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { TestResult } from "@/types";

function AnimatedCounter({
  to,
  suffix = "",
  duration = 1.4,
}: {
  to: number;
  suffix?: string;
  duration?: number;
}) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v).toLocaleString());
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    const controls = animate(mv, to, {
      duration,
      ease: [0.2, 0.8, 0.2, 1],
    });
    const unsub = rounded.on("change", setDisplay);
    return () => {
      controls.stop();
      unsub();
    };
  }, [to, duration, mv, rounded]);

  return (
    <span>
      {display}
      {suffix}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  delta,
  tint,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  suffix?: string;
  delta?: string;
  tint: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <Card className="glass hover-lift rounded-2xl p-5 border-border/60 hover:border-primary/40 group relative overflow-hidden">
        <div
          className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-30 group-hover:opacity-60 transition-opacity ${tint}`}
        />
        <div className="flex items-start justify-between relative">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground font-medium">
              {label}
            </p>
            <p className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
              <AnimatedCounter to={value} suffix={suffix} />
            </p>
            {delta && (
              <p className="text-[11px] text-muted-foreground/80 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-success" />
                {delta}
              </p>
            )}
          </div>
          <div className="p-2.5 rounded-xl bg-white/4 ring-1 ring-white/10">
            <Icon className="w-5 h-5 text-foreground/80" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <Card className="glass rounded-2xl p-10 text-center border-border/60">
      <div className="mx-auto w-14 h-14 rounded-2xl gradient-brand grid place-items-center mb-4 opacity-90">
        <Sparkles className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">
        Your analytics will appear here
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2">
        Complete your first mock test to see accuracy trends, section-wise
        performance, and a full review of every question you answered.
      </p>
      <div className="mt-5">
        <Button
          onClick={onStart}
          className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
        >
          <Play className="w-4 h-4" /> Start a test
        </Button>
      </div>
    </Card>
  );
}

export function Dashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({
    totalTests: 0,
    avgAccuracy: 0,
    totalTime: 0,
  });
  const [results, setResults] = useState<TestResult[]>([]);
  const testBanks = useAppStore((s) => s.testBanks);

  useEffect(() => {
    setMounted(true);
    const getDashboardStats = useAppStore.getState().getDashboardStats;
    const getTestResults = useAppStore.getState().getTestResults;
    setStats(getDashboardStats());
    setResults(getTestResults());

    const unsub = useAppStore.subscribe((state) => {
      setStats(state.getDashboardStats());
      setResults(state.getTestResults());
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

  const lastResult = results.length > 0 ? results[results.length - 1] : null;

  const sectionData = useMemo(() => {
    if (!lastResult) return [];
    return Object.entries(lastResult.sectionPerformance).map(
      ([section, perf]) => ({
        name: section.length > 10 ? section.slice(0, 10) + "…" : section,
        score: Math.round((perf.correct / perf.total) * 100),
      }),
    );
  }, [lastResult]);

  const bestAccuracy = useMemo(
    () => (results.length ? Math.max(...results.map((r) => r.accuracy)) : 0),
    [results],
  );

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 skeleton-shimmer rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 skeleton-shimmer rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="ambient-bg space-y-8">
      {/* Hero greeting */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
        className="relative"
      >
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs text-muted-foreground mb-4">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-success/60 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
              Workspace ready
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Master <span className="gradient-text">CIL MT Preparation</span>
            </h1>
            <p className="text-muted-foreground mt-3 max-w-xl">
              Track accuracy, section mastery and per-question review — all in one
              clean workspace.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => router.push("/import")}
              variant="outline"
              className="rounded-full border-border/60 hover:border-primary/50"
            >
              Import Test
            </Button>
            <Button
              onClick={() =>
                testBanks.length && router.push(`/test/${testBanks[0].id}`)
              }
              className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            >
              <Play className="w-4 h-4" /> Start a test
            </Button>
          </div>
        </div>
      </motion.section>

      {/* Stat grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={BookOpen}
          label="Tests taken"
          value={stats.totalTests}
          tint="bg-primary/40"
          delay={0.05}
        />
        <StatCard
          icon={Target}
          label="Avg accuracy"
          value={stats.avgAccuracy}
          suffix="%"
          tint="bg-accent/40"
          delay={0.1}
          delta={
            bestAccuracy ? `Best ${bestAccuracy}%` : "No data yet"
          }
        />
        <StatCard
          icon={Clock}
          label="Time invested"
          value={Math.floor(stats.totalTime / 60)}
          suffix="m"
          tint="bg-fuchsia-500/30"
          delay={0.15}
        />
        <StatCard
          icon={Flame}
          label="Available tests"
          value={testBanks.length}
          tint="bg-amber-500/30"
          delay={0.2}
        />
      </section>

      {/* Charts */}
      {results.length === 0 ? (
        <EmptyState
          onStart={() =>
            testBanks.length && router.push(`/test/${testBanks[0].id}`)
          }
        />
      ) : (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="glass rounded-2xl p-6 border-border/60">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    Accuracy trend
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Last {accuracyData.length} attempts
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">
                  Avg <span className="text-foreground font-semibold">{stats.avgAccuracy}%</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={accuracyData}>
                  <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="hsl(252 87% 67%)" />
                      <stop offset="100%" stopColor="hsl(187 92% 60%)" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 6" stroke="hsl(240 6% 18%)" />
                  <XAxis stroke="hsl(240 5% 55%)" fontSize={11} tickLine={false} axisLine={false} dataKey="name" />
                  <YAxis stroke="hsl(240 5% 55%)" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip
                    cursor={{ stroke: "hsl(252 87% 67% / 0.4)", strokeWidth: 1 }}
                    contentStyle={{
                      backgroundColor: "hsl(240 8% 8%)",
                      border: "1px solid hsl(240 6% 18%)",
                      borderRadius: 10,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "hsl(0 0% 80%)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="url(#lineGrad)"
                    strokeWidth={2.5}
                    dot={{ fill: "hsl(252 87% 67%)", strokeWidth: 0, r: 3.5 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass rounded-2xl p-6 border-border/60">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    Section mastery
                  </h3>
                  <p className="text-xs text-muted-foreground">Latest attempt</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={sectionData}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(252 87% 67%)" />
                      <stop offset="100%" stopColor="hsl(252 87% 35%)" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 6" stroke="hsl(240 6% 18%)" />
                  <XAxis stroke="hsl(240 5% 55%)" fontSize={11} tickLine={false} axisLine={false} dataKey="name" />
                  <YAxis stroke="hsl(240 5% 55%)" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip
                    cursor={{ fill: "hsl(252 87% 67% / 0.08)" }}
                    contentStyle={{
                      backgroundColor: "hsl(240 8% 8%)",
                      border: "1px solid hsl(240 6% 18%)",
                      borderRadius: 10,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="score" fill="url(#barGrad)" radius={[10, 10, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        </section>
      )}

      {/* Recent attempts — links to review */}
      {results.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="glass rounded-2xl p-6 border-border/60">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Recent attempts
                </h3>
                <p className="text-xs text-muted-foreground">
                  Click any attempt to review which questions you got wrong
                </p>
              </div>
            </div>
            <ul className="divide-y divide-border/60">
              {results
                .slice()
                .reverse()
                .slice(0, 6)
                .map((r) => {
                  const grade =
                    r.accuracy >= 75
                      ? "text-success"
                      : r.accuracy >= 50
                      ? "text-warning"
                      : "text-destructive";
                  return (
                    <li key={r.attemptId}>
                      <button
                        type="button"
                        onClick={() => router.push(`/results/${r.attemptId}`)}
                        className="w-full flex items-center justify-between gap-4 py-3 px-2 -mx-2 rounded-xl hover:bg-white/2.5 transition-colors group ring-focus text-left"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {r.testName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(r.completedAt).toLocaleString()} ·{" "}
                            {r.correctAnswers}/{r.totalQuestions} correct ·{" "}
                            {r.wrongAnswers} wrong
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`text-base font-semibold tabular-nums ${grade}`}>
                            {r.accuracy}%
                          </span>
                          <span className="hidden sm:inline-flex items-center gap-1 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                            <Eye className="w-3.5 h-3.5" /> Review
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
            </ul>
          </Card>
        </motion.section>
      )}

      {/* Available tests */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="glass rounded-2xl p-6 border-border/60">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Available tests
              </h3>
              <p className="text-xs text-muted-foreground">
                {testBanks.length} test{testBanks.length === 1 ? "" : "s"} ready
                to attempt
              </p>
            </div>
            <Button
              onClick={() => router.push("/import")}
              variant="outline"
              className="rounded-full border-border/60 hover:border-primary/50"
            >
              Add new
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {testBanks.map((test, idx) => (
              <motion.div
                key={test.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + idx * 0.04 }}
              >
                <div className="hover-lift group relative overflow-hidden rounded-xl p-4 bg-white/2 border border-border/60 hover:border-primary/50 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-foreground truncate group-hover:gradient-text transition-colors">
                      {test.testName}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {test.questions.length} questions · {test.duration} min
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push(`/test/${test.id}`)}
                    size="sm"
                    className="rounded-full bg-primary/15 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/40 transition-colors gap-1.5"
                  >
                    Start <Play className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.section>
    </div>
  );
}
