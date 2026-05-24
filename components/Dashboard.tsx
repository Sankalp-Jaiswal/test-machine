"use client";

import { useAppStore } from "@/store/useAppStore";
import { motion } from "framer-motion";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Trophy, TrendingUp, Clock, BookOpen } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export function Dashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({ totalTests: 0, avgAccuracy: 0, totalTime: 0 });
  const [results, setResults] = useState([]);
  const testBanks = useAppStore((state) => state.testBanks);
  
  useEffect(() => {
    setMounted(true);
    // Update stats after mount
    const getDashboardStats = useAppStore.getState().getDashboardStats;
    const getTestResults = useAppStore.getState().getTestResults;
    setStats(getDashboardStats());
    setResults(getTestResults());
  }, []);

  const accuracyData = results
    .slice(-10)
    .map((r, idx) => ({
      name: `Test ${idx + 1}`,
      accuracy: r.accuracy,
    }));

  const sectionData = results.length > 0
    ? Object.entries(results[results.length - 1].sectionPerformance)
        .map(([section, perf]) => ({
          name: section,
          score: Math.round((perf.correct / perf.total) * 100),
        }))
    : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Track your preparation progress</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { icon: BookOpen, label: "Tests Taken", value: stats.totalTests, color: "from-blue-500 to-blue-600" },
          { icon: Trophy, label: "Avg Accuracy", value: `${stats.avgAccuracy}%`, color: "from-yellow-500 to-yellow-600" },
          { icon: Clock, label: "Total Time", value: `${Math.floor(stats.totalTime / 60)}m`, color: "from-purple-500 to-purple-600" },
          { icon: TrendingUp, label: "Available Tests", value: testBanks.length, color: "from-green-500 to-green-600" },
        ].map((stat, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }}>
            <Card className="bg-card/50 border-border/30 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                </div>
                <div className={`bg-gradient-to-br ${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accuracy Trend */}
        {accuracyData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-card/50 border-border/30 backdrop-blur-sm p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Accuracy Trend</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={accuracyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                  <XAxis stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }} />
                  <Line type="monotone" dataKey="accuracy" stroke="#3995FF" strokeWidth={2} dot={{ fill: "#3995FF" }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        )}

        {/* Section Performance */}
        {sectionData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-card/50 border-border/30 backdrop-blur-sm p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Section Performance</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={sectionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                  <XAxis stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }} />
                  <Bar dataKey="score" fill="#FFED4E" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Tests Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card className="bg-card/50 border-border/30 backdrop-blur-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-white">Available Tests</h3>
          </div>
          <div className="space-y-3">
            {testBanks.map((test, idx) => (
              <motion.div key={test.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + idx * 0.1 }}>
                <div className="flex justify-between items-center p-4 bg-secondary/50 rounded-lg border border-border/30 hover:border-primary/50 transition-all duration-300 group">
                  <div className="flex-1">
                    <h4 className="text-white font-medium group-hover:text-primary transition-colors">{test.testName}</h4>
                    <p className="text-sm text-muted-foreground">{test.questions.length} questions • {test.duration} minutes</p>
                  </div>
                  <Button onClick={() => router.push(`/test/${test.id}`)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    Start Test
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
