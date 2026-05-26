"use client";

import { useAppStore } from "@/store/useAppStore";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Trash2, Edit2, WandSparkles } from "lucide-react";
import toast from "react-hot-toast";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import type { Difficulty } from "@/types";

const ALL_DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

export default function AdminPage() {
  const testBanks = useAppStore((state) => state.testBanks);
  const deleteTestBank = useAppStore((state) => state.deleteTestBank);
  const paperFilters = useAppStore((state) => state.paperFilters);
  const addPaperFilter = useAppStore((state) => state.addPaperFilter);
  const deletePaperFilter = useAppStore((state) => state.deletePaperFilter);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterName, setFilterName] = useState("");
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<Difficulty[]>([
    "easy",
    "medium",
    "hard",
  ]);
  const [questionCount, setQuestionCount] = useState<number | "all">("all");
  const [duration, setDuration] = useState(30);

  const poolQuestions = useMemo(
    () =>
      testBanks
        .filter((bank) => !bank.id.startsWith("pooled_"))
        .flatMap((bank) => bank.questions),
    [testBanks],
  );

  const sectionCounts = useMemo(() => {
    const map: Record<string, number> = {};
    poolQuestions.forEach((q) => {
      map[q.section] = (map[q.section] || 0) + 1;
    });
    return map;
  }, [poolQuestions]);

  const allSections = useMemo(
    () => Object.keys(sectionCounts).sort((a, b) => sectionCounts[b] - sectionCounts[a]),
    [sectionCounts],
  );

  const matchingQuestions = useMemo(() => {
    if (selectedSections.length === 0 || selectedDifficulties.length === 0) return 0;
    return poolQuestions.filter(
      (q) =>
        selectedSections.includes(q.section) &&
        selectedDifficulties.includes(q.difficulty),
    ).length;
  }, [poolQuestions, selectedSections, selectedDifficulties]);

  useEffect(() => {
    if (selectedSections.length === 0 && allSections.length > 0) {
      setSelectedSections(allSections);
    }
  }, [allSections, selectedSections.length]);

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete "${name}"? This action cannot be undone.`)) {
      deleteTestBank(id);
      toast.success("Test bank deleted");
    }
  };

  const handleCreateFilter = () => {
    if (!filterName.trim()) {
      toast.error("Please enter a filter name");
      return;
    }
    if (selectedSections.length === 0) {
      toast.error("Select at least one section");
      return;
    }
    if (selectedDifficulties.length === 0) {
      toast.error("Select at least one difficulty");
      return;
    }
    if (matchingQuestions === 0) {
      toast.error("No matching questions for the selected setup");
      return;
    }

    const normalizedCount =
      questionCount === "all"
        ? "all"
        : Math.max(1, Math.min(questionCount, matchingQuestions));

    addPaperFilter({
      name: filterName.trim(),
      sections: selectedSections,
      difficulties: selectedDifficulties,
      questionCount: normalizedCount,
      duration: Math.max(1, duration),
    });

    setFilterName("");
    setQuestionCount("all");
    setDuration(30);
    toast.success("Paper filter created");
  };

  return (
    <AppShell>
      <div className="w-full">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Test Management</h1>
            <p className="text-muted-foreground">Manage and organize your question banks</p>
          </motion.div>

          <Card className="glass rounded-2xl border-border/60 p-6 mb-8">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <WandSparkles className="w-4 h-4 text-primary" />
                  Create Paper Filter
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Save a reusable configuration for practice papers.
                </p>
              </div>
              <div className="text-xs text-muted-foreground">
                Matching pool: <span className="font-semibold text-foreground">{matchingQuestions}</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Input
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  placeholder="Filter name (e.g., Quant + GK Fast Set)"
                  className="bg-background border-border/70"
                />
                <div className="rounded-xl border border-border/60 bg-secondary/30 p-3">
                  <p className="text-xs font-semibold text-foreground mb-2">Sections</p>
                  <div className="flex flex-wrap gap-2">
                    {allSections.map((section) => {
                      const active = selectedSections.includes(section);
                      return (
                        <button
                          key={section}
                          type="button"
                          onClick={() =>
                            setSelectedSections((prev) =>
                              active ? prev.filter((s) => s !== section) : [...prev, section],
                            )
                          }
                          className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                            active
                              ? "bg-primary/15 text-primary border-primary/40"
                              : "bg-background text-muted-foreground border-border/70"
                          }`}
                        >
                          {section} ({sectionCounts[section] ?? 0})
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-border/60 bg-secondary/30 p-3">
                  <p className="text-xs font-semibold text-foreground mb-2">Difficulty</p>
                  <div className="flex gap-2 flex-wrap">
                    {ALL_DIFFICULTIES.map((difficulty) => {
                      const active = selectedDifficulties.includes(difficulty);
                      return (
                        <button
                          key={difficulty}
                          type="button"
                          onClick={() =>
                            setSelectedDifficulties((prev) =>
                              active ? prev.filter((d) => d !== difficulty) : [...prev, difficulty],
                            )
                          }
                          className={`rounded-full border px-3 py-1 text-xs uppercase transition-colors ${
                            active
                              ? "bg-primary/15 text-primary border-primary/40"
                              : "bg-background text-muted-foreground border-border/70"
                          }`}
                        >
                          {difficulty}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="number"
                    min={1}
                    max={Math.max(1, matchingQuestions)}
                    value={questionCount === "all" ? "" : questionCount}
                    placeholder={`Questions (or leave blank for all)`}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10);
                      if (Number.isNaN(value)) setQuestionCount("all");
                      else setQuestionCount(Math.max(1, value));
                    }}
                    className="bg-background border-border/70"
                  />
                  <Input
                    type="number"
                    min={1}
                    max={999}
                    value={duration}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10);
                      setDuration(Number.isNaN(value) ? 30 : Math.max(1, value));
                    }}
                    placeholder="Time (min)"
                    className="bg-background border-border/70"
                  />
                </div>

                <Button onClick={handleCreateFilter} className="w-full">
                  Save Filter Preset
                </Button>
              </div>
            </div>
          </Card>

          <Card className="glass rounded-2xl border-border/60 p-6 mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-foreground">Saved Paper Filters</h2>
              <span className="text-xs text-muted-foreground">{paperFilters.length} total</span>
            </div>
            {paperFilters.length === 0 ? (
              <p className="text-sm text-muted-foreground">No saved filters yet.</p>
            ) : (
              <div className="space-y-2">
                {paperFilters.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-background/70 p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{preset.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {preset.sections.length} sections • {preset.difficulties.join("/")} •{" "}
                        {preset.questionCount === "all" ? "all questions" : `${preset.questionCount} questions`} •{" "}
                        {preset.duration} min
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-destructive/40 text-destructive"
                      onClick={() => {
                        deletePaperFilter(preset.id);
                        toast.success("Filter removed");
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Tests List */}
          <div className="space-y-4">
            {testBanks.length === 0 ? (
              <Card className="bg-card/50 border-border/30 backdrop-blur-sm p-12 text-center">
                <p className="text-muted-foreground">No test banks imported yet. Go to Import to add tests.</p>
              </Card>
            ) : (
              testBanks.map((test, idx) => (
                <motion.div
                  key={test.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card
                    onClick={() => setSelectedId(selectedId === test.id ? null : test.id)}
                    className="bg-card/50 border-border/30 backdrop-blur-sm p-6 cursor-pointer hover:border-primary/50 transition-all duration-300 group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white group-hover:text-primary transition-colors">{test.testName}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {test.questions.length} questions • {test.duration} minutes • Created{" "}
                          {new Date(test.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            toast("Edit feature coming soon");
                          }}
                          size="sm"
                          variant="outline"
                          className="border-border/30 hover:border-primary/50 gap-2"
                        >
                          <Edit2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Edit</span>
                        </Button>

                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(test.id, test.testName);
                          }}
                          size="sm"
                          variant="outline"
                          className="border-red-500/30 hover:border-red-500/50 hover:bg-red-500/10 text-red-400 gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Delete</span>
                        </Button>
                      </div>
                    </div>

                    {/* Sections */}
                    {selectedId === test.id && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="border-t border-border/30 pt-4 mt-4">
                        <h4 className="text-sm font-semibold text-muted-foreground mb-3">Sections</h4>
                        <div className="flex flex-wrap gap-2">
                          {Array.from(new Set(test.questions.map((q) => q.section))).map((section) => {
                            const count = test.questions.filter((q) => q.section === section).length;
                            return (
                              <div key={section} className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-semibold">
                                {section} ({count})
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </Card>
                </motion.div>
              ))
            )}
          </div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Tests", value: testBanks.length },
              { label: "Total Questions", value: testBanks.reduce((sum, t) => sum + t.questions.length, 0) },
              {
                label: "Total Duration",
                value: `${testBanks.reduce((sum, t) => sum + t.duration, 0)} min`,
              },
              {
                label: "Avg Questions/Test",
                value: testBanks.length > 0 ? Math.round(testBanks.reduce((sum, t) => sum + t.questions.length, 0) / testBanks.length) : 0,
              },
            ].map((stat, idx) => (
              <Card key={idx} className="bg-card/50 border-border/30 backdrop-blur-sm p-4 text-center">
                <p className="text-muted-foreground text-sm mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-primary">{stat.value}</p>
              </Card>
            ))}
          </motion.div>
        </div>
    </AppShell>
  );
}
