"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TestResult } from "@/types";
import toast from "react-hot-toast";
import {
  CheckCircle2,
  User,
  RotateCcw,
  Eye,
  Search,
  Trophy,
  Target,
  Clock,
  Filter,
  ArrowUpRight,
  Sparkles,
  Flame,
} from "lucide-react";

type SortKey = "recent" | "accuracy" | "name";
type StatusFilter = "all" | "pass" | "fail";

const PASS_THRESHOLD = 60;

function gradeTone(p: number) {
  if (p >= 75) return { color: "text-success", ring: "ring-success/40", bg: "bg-success/10" };
  if (p >= 50) return { color: "text-warning", ring: "ring-warning/40", bg: "bg-warning/10" };
  return { color: "text-destructive", ring: "ring-destructive/40", bg: "bg-destructive/10" };
}

export function Profile() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const retryAttempt = useAppStore((s) => s.retryAttempt);

  useEffect(() => {
    setMounted(true);
    setResults(useAppStore.getState().getTestResults());
    const unsub = useAppStore.subscribe((state) => setResults(state.getTestResults()));
    return () => unsub();
  }, []);

  const stats = useMemo(() => {
    if (results.length === 0) {
      return { total: 0, passed: 0, avg: 0, best: 0, totalMinutes: 0 };
    }
    const passed = results.filter((r) => r.accuracy >= PASS_THRESHOLD).length;
    const avg = Math.round(results.reduce((s, r) => s + r.accuracy, 0) / results.length);
    const best = Math.max(...results.map((r) => r.accuracy));
    const totalMinutes = Math.round(results.reduce((s, r) => s + r.timeTaken, 0) / 60);
    return { total: results.length, passed, avg, best, totalMinutes };
  }, [results]);

  const visible = useMemo(() => {
    const filtered = results.filter((r) => {
      if (status === "pass" && r.accuracy < PASS_THRESHOLD) return false;
      if (status === "fail" && r.accuracy >= PASS_THRESHOLD) return false;
      if (query.trim()) {
        return r.testName.toLowerCase().includes(query.trim().toLowerCase());
      }
      return true;
    });
    switch (sort) {
      case "accuracy":
        return [...filtered].sort((a, b) => b.accuracy - a.accuracy);
      case "name":
        return [...filtered].sort((a, b) => a.testName.localeCompare(b.testName));
      case "recent":
      default:
        return [...filtered].sort((a, b) => b.completedAt - a.completedAt);
    }
  }, [results, query, sort, status]);

  const handleRetry = (result: TestResult) => {
    setRetryingId(result.attemptId);
    const targetTestId = retryAttempt(result.attemptId);
    if (!targetTestId) {
      setRetryingId(null);
      toast.error("Couldn't restart this attempt — the question data is missing.");
      return;
    }
    toast.success("Retry started — same questions, same order.");
    router.push(`/test/${targetTestId}`);
  };

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 skeleton-shimmer rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 skeleton-shimmer rounded-2xl" />
          ))}
        </div>
        <div className="h-96 skeleton-shimmer rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      {/* Left column: avatar/details and stats */}
      <div className="lg:col-span-1 space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs text-muted-foreground mb-4">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            Your profile
          </div>
          <Card className="glass p-6 rounded-3xl flex items-center gap-4 border-border/60">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">User Profile</h1>
              <p className="text-sm text-muted-foreground">Manage your history</p>
            </div>
          </Card>
        </motion.section>

        {/* Stats grid */}
        <section className="grid grid-cols-2 gap-4">
          <ProfileStat icon={Trophy} label="Attempts" value={stats.total} tint="bg-primary/40" delay={0.05} />
          <ProfileStat
            icon={CheckCircle2}
            label="Marked done"
            value={stats.passed}
            tint="bg-success/40"
            delay={0.1}
          />
          <ProfileStat
            icon={Target}
            label="Avg accuracy"
            value={stats.avg}
            suffix="%"
            tint="bg-accent/40"
            delay={0.15}
          />
          <ProfileStat
            icon={Clock}
            label="Time invested"
            value={stats.totalMinutes}
            suffix="m"
            tint="bg-fuchsia-500/30"
            delay={0.2}
          />
        </section>
      </div>

      {/* Right column: attempts list */}
      <div className="lg:col-span-2 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="glass rounded-2xl p-6 border-border/60">
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-foreground">All attempts</h2>
                <p className="text-xs text-muted-foreground">
                  {visible.length} shown of {stats.total}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search test name"
                    className="h-9 pl-8 w-52 bg-background/60 border-border/60 text-sm"
                  />
                </div>
                <div className="flex gap-1 p-1 rounded-full glass">
                  {(["all", "pass", "fail"] as StatusFilter[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => setStatus(key)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        status === key ? "bg-primary/20 text-foreground ring-1 ring-primary/40" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {key === "all" ? "All" : key === "pass" ? `≥${PASS_THRESHOLD}%` : `<${PASS_THRESHOLD}%`}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1 p-1 rounded-full glass">
                  {(["recent", "accuracy", "name"] as SortKey[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => setSort(key)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        sort === key ? "bg-primary/20 text-foreground ring-1 ring-primary/40" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Filter className="inline w-3 h-3 mr-1" />
                      {key === "recent" ? "Recent" : key === "accuracy" ? "Accuracy" : "Name"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {visible.length === 0 ? (
              <div className="py-16">
                <Flame className="mb-3 h-10 w-10 text-muted-foreground/60" />
                <p className="text-sm text-foreground font-medium">No attempts yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Take any test and it will land here, ready to retry.
                </p>
                <Button
                  onClick={() => router.push("/")}
                  className="rounded-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Pick a test
                </Button>
              </div>
            ) : (
              <ul className="space-y-2">
                {visible.map((r) => {
                  const tone = gradeTone(r.accuracy);
                  const passed = r.accuracy >= PASS_THRESHOLD;
                  const dateStr = new Date(r.completedAt).toLocaleString();
                  const minutes = Math.floor(r.timeTaken / 60);
                  const seconds = r.timeTaken % 60;
                  const isPooled = r.testId.startsWith("pooled_");
                  const filterSummary = r.filters
                    ? [
                        r.filters.sections?.length ? `${r.filters.sections.length} section(s)` : null,
                        r.filters.difficulties?.length && r.filters.difficulties.length < 3
                          ? r.filters.difficulties.join("/")
                          : null,
                        r.filters.shuffleQuestions ? "shuffled Qs" : null,
                        r.filters.shuffleOptions ? "shuffled options" : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")
                    : "";

                  return (
                    <li
                      key={r.attemptId}
                      className="rounded-2xl p-4 glass bg-white/5 border border-border/60 hover:border-primary/40 transition-colors"
                    >
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className={`shrink-0 w-12 h-12 rounded-xl grid place-items-center ring-1 ${tone.bg} ${tone.ring}`}>
                          <span className={`text-base font-bold tabular-nums ${tone.color}`}>
                            {r.accuracy}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-foreground truncate">{r.testName}</p>
                            {isPooled && (
                              <span className="text-[10px] uppercase tracking-[0.14em] font-semibold text-accent bg-accent/10 ring-1 ring-accent/30 rounded-full px-2 py-0.5">
                                Custom mix
                              </span>
                            )}
                            <span
                              className={`text-[10px] uppercase tracking-[0.14em] font-semibold rounded-full px-2 py-0.5 ring-1 ${
                                passed
                                  ? "text-success bg-success/10 ring-success/30"
                                  : "text-warning bg-warning/10 ring-warning/30"
                              }`}
                            >
                              {passed ? "Done · Pass" : "Done · Below pass"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {dateStr} · {r.correctAnswers}/{r.totalQuestions} correct · {r.wrongAnswers} wrong · {minutes}m {seconds}s
                          </p>
                          {filterSummary && (
                            <p className="text-[11px] text-muted-foreground/80 mt-0.5">{filterSummary}</p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full border-border/60 gap-1.5"
                            onClick={() => router.push(`/results/${r.attemptId}`)}
                          >
                            <Eye className="w-3.5 h-3.5" /> Report
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            disabled={retryingId === r.attemptId}
                            className="rounded-full bg-primary/15 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/40 transition-colors gap-1.5"
                            onClick={() => handleRetry(r)}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            {retryingId === r.attemptId ? "Loading…" : "Retry"}
                          </Button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function ProfileStat({
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
        <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-30 group-hover:opacity-60 transition-opacity ${tint}`} />
        <div className="flex items-start justify-between relative">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground font-medium">{label}</p>
            <p className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {value}
              {suffix}
            </p>
            {delta && <p className="text-[11px] text-muted-foreground/80">{delta}</p>}
          </div>
          <div className="p-2.5 rounded-xl bg-white/4 ring-1 ring-white/10">
            <Icon className="w-5 h-5 text-foreground/80" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
