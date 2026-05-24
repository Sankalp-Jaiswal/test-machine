"use client";

import { useAppStore } from "@/store/useAppStore";
import { TestResult } from "@/types";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useRouter } from "next/navigation";
import { Trophy, Download, RotateCcw, Home } from "lucide-react";
import { generatePDFReport } from "@/lib/pdfGenerator";

export function ResultsScreen({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const results = useAppStore((state) => state.getTestResults());
  const result = results.find((r) => r.attemptId === attemptId);

  if (!result) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Result not found</p>
      </div>
    );
  }

  const scorePercentage = result.accuracy;
  const scoreColor = scorePercentage >= 75 ? "text-green-400" : scorePercentage >= 50 ? "text-yellow-400" : "text-red-400";

  const sectionData = Object.entries(result.sectionPerformance).map(([name, perf]) => ({
    name,
    correct: perf.correct,
    total: perf.total,
    percentage: Math.round((perf.correct / perf.total) * 100),
  }));

  const difficultyData = Object.entries(result.difficultyPerformance).map(([name, perf]) => ({
    name: name.toUpperCase(),
    value: Math.round((perf.correct / perf.total) * 100),
  }));

  const resultSummary = [
    { label: "Correct", value: result.correctAnswers, color: "from-green-500 to-green-600" },
    { label: "Wrong", value: result.wrongAnswers, color: "from-red-500 to-red-600" },
    { label: "Skipped", value: result.skipped, color: "from-yellow-500 to-yellow-600" },
  ];

  const COLORS = ["#3B82F6", "#FBBF24", "#F87171"];

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-12">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-primary/20 rounded-full">
              <Trophy className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Test Completed!</h1>
          <p className="text-muted-foreground text-lg">{result.testName}</p>
        </motion.div>

        {/* Main Score Card */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="mb-8">
          <Card className="bg-gradient-to-br from-card/50 to-card/30 border-border/30 backdrop-blur-sm p-8 lg:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Score Circle */}
              <div className="flex justify-center">
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="96" cy="96" r="88" fill="none" stroke="#1a1a1a" strokeWidth="8" />
                    <motion.circle
                      cx="96"
                      cy="96"
                      r="88"
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 88}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 88 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 88 * (1 - scorePercentage / 100) }}
                      transition={{ duration: 2, ease: "easeOut" }}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="text-center">
                    <p className={`text-6xl font-bold ${scoreColor}`}>{result.accuracy}</p>
                    <p className="text-muted-foreground text-sm">Accuracy</p>
                  </div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  {resultSummary.map((stat, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + idx * 0.1 }}>
                      <div className={`bg-gradient-to-br ${stat.color} rounded-lg p-4 text-center`}>
                        <p className="text-3xl font-bold text-white">{stat.value}</p>
                        <p className="text-sm text-white/80 mt-1">{stat.label}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="space-y-2 pt-4 border-t border-border/30">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Questions:</span>
                    <span className="text-white font-semibold">{result.totalQuestions}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Time Taken:</span>
                    <span className="text-white font-semibold">
                      {Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Section Performance */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-card/50 border-border/30 backdrop-blur-sm p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Section-wise Performance</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={sectionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                  <XAxis stroke="#666" fontSize={12} />
                  <YAxis stroke="#666" />
                  <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }} />
                  <Bar dataKey="percentage" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          {/* Difficulty Distribution */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-card/50 border-border/30 backdrop-blur-sm p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Difficulty-wise Performance</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={difficultyData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                    {difficultyData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        </div>

        {/* Detailed Breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mb-8">
          <Card className="bg-card/50 border-border/30 backdrop-blur-sm p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Detailed Breakdown</h3>
            <div className="space-y-3">
              {sectionData.map((section, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + idx * 0.05 }}>
                  <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border/30">
                    <div className="flex-1">
                      <p className="text-white font-medium">{section.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {section.correct} correct out of {section.total} questions
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{section.percentage}%</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="flex flex-col sm:flex-row gap-4">
          <Button onClick={() => generatePDFReport(result)} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
            <Download className="w-4 h-4" />
            Download Report
          </Button>
          <Button onClick={() => router.push("/")} variant="outline" className="flex-1 border-border/30 hover:border-primary/50 gap-2">
            <Home className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <Button onClick={() => router.push("/")} className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
            <RotateCcw className="w-4 h-4" />
            Retake Test
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
