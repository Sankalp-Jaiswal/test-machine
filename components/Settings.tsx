"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Database,
  Trash2,
  Sparkles,
  ChevronRight,
  Layers,
  Calendar,
  ListStart,
  RotateCcw,
  Shuffle,
  X,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Difficulty, QuestionOrderMode } from "@/types";
import { useSession } from "next-auth/react";
import type { ElementType } from "react";

const ALL_DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

export function Settings() {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState("system"); // Appearance theme
  const testBanks = useAppStore((s) => s.testBanks);
  const deleteTestBank = useAppStore((s) => s.deleteTestBank);
  const paperFilters = useAppStore((s) => s.paperFilters);
  const addPaperFilter = useAppStore((s) => s.addPaperFilter);
  const deletePaperFilter = useAppStore((s) => s.deletePaperFilter);
  const poolStats = useMemo(() => {
    const banks = testBanks.filter((b) => !b.id.startsWith("pooled_"));
    const all = banks.flatMap((b) => b.questions);
    const bySection: Record<string, number> = {};
    const byDifficulty: Record<"easy" | "medium" | "hard", number> = { easy: 0, medium: 0, hard: 0 };
    all.forEach((q) => {
      bySection[q.section] = (bySection[q.section] || 0) + 1;
      byDifficulty[q.difficulty] = (byDifficulty[q.difficulty] || 0) + 1;
    });
    return {
      totalQuestions: all.length,
      totalSections: Object.keys(bySection).length,
      totalImports: banks.length,
      bySection,
      byDifficulty,
    };
  }, [testBanks]);
  const [importing, setImporting] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [selectedFilterSections, setSelectedFilterSections] = useState<string[]>([]);
  const [selectedFilterDifficulties, setSelectedFilterDifficulties] = useState<Difficulty[]>([]);
  const [filterQuestionCount, setFilterQuestionCount] = useState<number | "all">("all");
  const [filterDuration, setFilterDuration] = useState(30);
  const [filterOrderMode, setFilterOrderMode] = useState<QuestionOrderMode>("latest");

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [users, setUsers] = useState<Array<{ id: string; email: string; name: string; role: "admin" | "student" }>>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    (async () => {
      setUsersLoading(true);
      try {
        const res = await fetch("/api/admin/users");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load users");
        if (active) setUsers(Array.isArray(data) ? data : []);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load users");
      } finally {
        if (active) setUsersLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [isAdmin]);

  const realBanks = useMemo(
    () => testBanks.filter((b) => !b.id.startsWith("pooled_")),
    [testBanks],
  );

  const allSections = useMemo(
    () => Object.keys(poolStats.bySection).sort((a, b) => poolStats.bySection[b] - poolStats.bySection[a]),
    [poolStats.bySection],
  );

  const filterPoolSize = useMemo(() => {
    if (selectedFilterSections.length === 0 || selectedFilterDifficulties.length === 0) return 0;
    return realBanks
      .flatMap((b) => b.questions)
      .filter(
        (q) =>
          selectedFilterSections.includes(q.section) &&
          selectedFilterDifficulties.includes(q.difficulty),
      ).length;
  }, [realBanks, selectedFilterSections, selectedFilterDifficulties]);

const handleDelete = async (id: string, name: string) => {
  if (!confirm(`Delete "${name}"? Its questions will leave your pool. This can't be undone.`)) return;
  await deleteTestBank(id);
  // Refresh the app store to reflect deletion
  await useAppStore.getState().loadFromStorage();
  toast.success('Import deleted');
};

const handleCreatePaperFilter = () => {
  if (!filterName.trim()) {
    toast.error("Enter a paper name");
    return;
  }
  if (selectedFilterSections.length === 0) {
    toast.error("Select at least one section");
    return;
  }
  if (selectedFilterDifficulties.length === 0) {
    toast.error("Select at least one difficulty");
    return;
  }
  if (filterPoolSize === 0) {
    toast.error("No questions in pool for this selection");
    return;
  }

  const normalizedCount =
    filterQuestionCount === "all"
      ? "all"
      : Math.max(1, Math.min(filterQuestionCount, filterPoolSize));

  addPaperFilter({
    name: filterName.trim(),
    sections: selectedFilterSections,
    difficulties: selectedFilterDifficulties,
    questionCount: normalizedCount,
    duration: Math.max(1, filterDuration),
    orderMode: filterOrderMode,
  });

  setFilterName("");
  setSelectedFilterSections([]);
  setSelectedFilterDifficulties([]);
  setFilterQuestionCount("all");
  setFilterDuration(30);
  setFilterOrderMode("latest");
  toast.success("Saved paper created");
};

  // New save handler for Settings
  const handleSave = () => {
    toast.success('Settings saved');
    // In a real app you'd persist theme etc.
  };

  if (!mounted) {
    return <div className="h-96 skeleton-shimmer rounded-2xl" />;
  }

  return (
    <Tabs defaultValue="account" className="space-y-8">
      <TabsList className="mb-6">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="appearance">Appearance</TabsTrigger>
        <TabsTrigger value="integrations">Integrations</TabsTrigger>
        {isAdmin ? <TabsTrigger value="users">Manage Users</TabsTrigger> : null}
      </TabsList>

      <TabsContent value="account" className="space-y-8">
        {/* Existing Settings content */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs text-muted-foreground mb-3">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            Settings
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Manage your <span className="gradient-text">question bank</span>
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm md:text-base">
            Import new question sets, browse existing imports, and remove anything you don't need.
          </p>
        </motion.section>

        {/* Quick actions */}        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isAdmin ? (
            <ActionTile
              icon={Upload}
              title="Import questions"
              description="Add a JSON, PDF, or DOCX file. Auto-grouped by section and difficulty."
              cta="Open importer"
              onClick={() => router.push("/import")}
              accent="primary"
            />
          ) : null}
          <ActionTile
            icon={Database}
            title="Pool summary"
            description={`${poolStats.totalQuestions} questions across ${poolStats.totalSections} sections, from ${poolStats.totalImports} import${poolStats.totalImports === 1 ? "" : "s"}.`}
            cta="View dashboard"
            onClick={() => router.push("/")}
            accent="accent"
          />
          {isAdmin ? (
            <ActionTile
              icon={Database}
              title="Import DB banks"
              description="Copy existing database test banks into your account (development only)."
              cta={importing ? "Importing..." : "Import now"}
              onClick={async () => {
                if (importing) return;
                setImporting(true);
                try {
                  const res = await fetch("/api/test-banks/import-all", { method: "POST" });
                  const body = await res.json();
                  if (!res.ok) {
                    toast.error(body?.error || "Import failed");
                  } else {
                    toast.success(`Imported ${body.imported} banks`);
                    try {
                      await useAppStore.getState().loadFromStorage();
                    } catch (_) {}
                  }
                } catch (e) {
                  toast.error("Import failed");
                } finally {
                  setImporting(false);
                }
              }}
              accent="primary"
            />
          ) : null}
        </section>

        <section className="space-y-4">
          {isAdmin ? (
          <Card className="glass rounded-2xl border-border/60 p-6">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-foreground">Create Saved Paper</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Build a paper once and reuse it directly from Practice.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Input
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  placeholder="Paper name"
                  className="bg-background border-border/70"
                />

                <div className="rounded-xl border border-border/60 bg-secondary/20 p-3">
                  <p className="mb-2 text-xs font-semibold text-foreground">Sections</p>
                  <div className="flex flex-wrap gap-2">
                    {allSections.map((section) => {
                      const active = selectedFilterSections.includes(section);
                      return (
                        <button
                          key={section}
                          type="button"
                          onClick={() =>
                            setSelectedFilterSections((prev) =>
                              active ? prev.filter((s) => s !== section) : [...prev, section],
                            )
                          }
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-colors ${
                            active
                              ? "border-primary/40 bg-primary/15 text-primary"
                              : "border-border/70 bg-background text-muted-foreground"
                          }`}
                        >
                          <span>{section}</span>
                          {active && <X className="h-3 w-3" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-border/60 bg-secondary/20 p-3">
                  <p className="mb-2 text-xs font-semibold text-foreground">Difficulty</p>
                  <div className="flex flex-wrap gap-2">
                    {ALL_DIFFICULTIES.map((difficulty) => {
                      const active = selectedFilterDifficulties.includes(difficulty);
                      return (
                        <button
                          key={difficulty}
                          type="button"
                          onClick={() =>
                            setSelectedFilterDifficulties((prev) =>
                              active
                                ? prev.filter((d) => d !== difficulty)
                                : [...prev, difficulty],
                            )
                          }
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs uppercase transition-colors ${
                            active
                              ? "border-primary/40 bg-primary/15 text-primary"
                              : "border-border/70 bg-background text-muted-foreground"
                          }`}
                        >
                          <span>{difficulty}</span>
                          {active && <X className="h-3 w-3" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <Input
                    type="number"
                    value={filterPoolSize}
                    readOnly
                    className="bg-background border-border/70"
                    aria-label="Pool size"
                  />
                  <Input
                    type="number"
                    min={1}
                    max={Math.max(1, filterPoolSize)}
                    value={filterQuestionCount === "all" ? "" : filterQuestionCount}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10);
                      if (Number.isNaN(value)) setFilterQuestionCount("all");
                      else setFilterQuestionCount(Math.max(1, value));
                    }}
                    placeholder="Questions"
                    className="bg-background border-border/70"
                  />
                  <Input
                    type="number"
                    min={1}
                    max={999}
                    value={filterDuration}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10);
                      setFilterDuration(Number.isNaN(value) ? 30 : Math.max(1, value));
                    }}
                    placeholder="Time (min)"
                    className="bg-background border-border/70"
                  />
                </div>
	                <p className="text-[11px] text-muted-foreground">
	                  Pool size auto-updates from selected sections + difficulties.
	                </p>
	                <div className="rounded-xl border border-border/60 bg-secondary/20 p-3">
	                  <p className="mb-2 text-xs font-semibold text-foreground">Question source</p>
	                  <div className="grid grid-cols-1 gap-2">
	                    <MiniSourceOption
	                      active={filterOrderMode === "latest"}
	                      icon={ListStart}
	                      title="Latest batch"
	                      onClick={() => setFilterOrderMode("latest")}
	                    />
	                    <MiniSourceOption
	                      active={filterOrderMode === "earliest"}
	                      icon={RotateCcw}
	                      title="Earliest batch"
	                      onClick={() => setFilterOrderMode("earliest")}
	                    />
	                    <MiniSourceOption
	                      active={filterOrderMode === "random"}
	                      icon={Shuffle}
	                      title="Random mix"
	                      onClick={() => setFilterOrderMode("random")}
	                    />
	                  </div>
	                </div>
	                <Button onClick={handleCreatePaperFilter} className="w-full">
	                  Save Paper
	                </Button>
              </div>
            </div>
          </Card>
          ) : null}

          <Card className="glass rounded-2xl border-border/60 p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-foreground">Saved Papers</h2>
              <span className="text-xs text-muted-foreground">{paperFilters.length} total</span>
            </div>
            {paperFilters.length === 0 ? (
              <p className="text-sm text-muted-foreground">No saved papers yet.</p>
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
	                        {preset.duration} min â€¢ {formatOrderMode(preset.orderMode ?? "latest")}
                      </p>
                    </div>
                    {isAdmin ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-destructive/40 text-destructive"
                        onClick={() => {
                          deletePaperFilter(preset.id);
                          toast.success("Saved paper removed");
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>

        {/* Imports list */}
        {isAdmin ? (
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="glass rounded-2xl p-6 border-border/60">
            <div className="flex items-center justify-between mb-5 gap-3">
              <div>
                <h2 className="text-base font-semibold text-foreground">Imports</h2>
                <p className="text-xs text-muted-foreground">
                  {realBanks.length} import{realBanks.length === 1 ? "" : "s"} contributing to your pool
                </p>
              </div>
              {isAdmin ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full gap-2"
                  onClick={() => router.push("/import")}
                >
                  <Upload className="w-3.5 h-3.5" /> Add
                </Button>
              ) : null}
            </div>

            {realBanks.length === 0 ? (
              <div className="py-10">
                <Upload className="mb-2 h-8 w-8 text-muted-foreground/60" />
                <p className="text-sm text-foreground font-medium">No imports yet</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  Once you import a file, its questions show up in your pool.
                </p>
                {isAdmin ? (
                  <Button
                    onClick={() => router.push("/import")}
                    className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                  >
                    <Upload className="w-4 h-4" /> Import questions
                  </Button>
                ) : null}
              </div>
            ) : (
              <ul className="space-y-2">
                {realBanks.map((b) => {
                  const sections = Array.from(new Set(b.questions.map((q) => q.section)));
                  const sectionCounts: Record<string, number> = {};
                  b.questions.forEach((q) => {
                    sectionCounts[q.section] = (sectionCounts[q.section] || 0) + 1;
                  });
                  const open = expandedId === b.id;

                  return (
                    <li
                      key={b.id}
                      className="rounded-2xl border border-border/60 bg-white/2 overflow-hidden"
                    >
                      <div className="flex items-center gap-4 p-4">
                        <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/15 ring-1 ring-primary/30 grid place-items-center">
                          <Layers className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground truncate">{b.testName}</p>
                          <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                            <span>
                              <Database className="inline w-3 h-3 mr-1" />
                              {b.questions.length} Qs
                            </span>
                            <span>
                              <Layers className="inline w-3 h-3 mr-1" />
                              {sections.length} section{sections.length === 1 ? "" : "s"}
                            </span>
                            <span>
                              <Calendar className="inline w-3 h-3 mr-1" />
                              {new Date(b.createdAt).toLocaleDateString()}
                            </span>
                          </p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full border-border/60 gap-1.5"
                            onClick={() => setExpandedId(open ? null : b.id)}
                          >
                            {open ? "Hide" : "Details"}
                            <ChevronRight
                              className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-90" : ""}`}
                            />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full border-destructive/40 text-destructive hover:bg-destructive/10 gap-1.5"
                            onClick={() => handleDelete(b.id, b.testName)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                      {open && (
                        <div className="border-t border-border/60 p-4 bg-secondary/20">
                          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-2">
                            Sections
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {sections.map((s) => (
                              <span
                                key={s}
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] bg-primary/10 text-primary ring-1 ring-primary/30"
                              >
                                {s}
                                <span className="text-[10px] text-primary/70">×{sectionCounts[s]}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </motion.section>
        ) : null}
      </TabsContent>

        <TabsContent value="appearance" className="p-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Theme</h2>
            <div className="flex gap-4">
              {['light','dark','system'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`px-4 py-2 rounded-full border ${theme===t ? "bg-primary text-primary-foreground" : "bg-transparent"} transition`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="p-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">External Test Banks</h2>
            <Button onClick={async () => {
              try {
                const res = await fetch('/api/integrations/sync-test-banks', { method: 'POST' });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Sync failed');
                toast.success(`Synced ${data.imported} external banks`);
                await useAppStore.getState().loadFromStorage();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Sync failed");
              }
            }} variant="outline">
              Sync External Test Banks
            </Button>
          </div>
        </TabsContent>
        {isAdmin ? (
          <TabsContent value="users" className="p-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Manage users</h2>
              <p className="text-sm text-muted-foreground">
                New users are created as students by default. Promote trusted users to admin.
              </p>
              {usersLoading ? (
                <p className="text-sm text-muted-foreground">Loading users...</p>
              ) : (
                <div className="space-y-2">
                  {users.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 p-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{u.name || "Unnamed user"}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-wider text-muted-foreground">{u.role}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            const nextRole = u.role === "admin" ? "student" : "admin";
                            try {
                              const res = await fetch(`/api/admin/users/${encodeURIComponent(u.id)}/role`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ role: nextRole }),
                              });
                              const body = await res.json().catch(() => ({}));
                              if (!res.ok) throw new Error(body?.error || "Failed to update role");
                              setUsers((prev) => prev.map((it) => (it.id === u.id ? { ...it, role: nextRole } : it)));
                              toast.success(`Role updated to ${nextRole}`);
                            } catch (e) {
                              toast.error(e instanceof Error ? e.message : "Failed to update role");
                            }
                          }}
                        >
                          Make {u.role === "admin" ? "student" : "admin"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        ) : null}
    </Tabs>
  );
}

function ActionTile({
  icon: Icon,
  title,
  description,
  cta,
  onClick,
  accent,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  cta: string;
  onClick: () => void;
  accent: "primary" | "accent";
}) {
  const tone =
    accent === "primary"
      ? "from-primary/20 to-primary/5 ring-primary/30 text-primary"
      : "from-accent/20 to-accent/5 ring-accent/30 text-accent";
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left rounded-2xl p-5 glass border border-border/60 hover:border-primary/40 transition-colors group"
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-2xl bg-gradient-to-br ring-1 ${tone}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
          <p className="text-xs font-medium mt-3 inline-flex items-center gap-1 text-primary group-hover:underline">
            {cta} <ChevronRight className="w-3.5 h-3.5" />
          </p>
        </div>
      </div>
    </button>
  );
}

function MiniSourceOption({
  active,
  icon: Icon,
  title,
  onClick,
}: {
  active: boolean;
  icon: ElementType;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-semibold transition-colors ring-focus ${
        active
          ? "border-primary/50 bg-primary/10 text-primary"
          : "border-border/70 bg-background text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{title}</span>
    </button>
  );
}

function formatOrderMode(mode: QuestionOrderMode): string {
  if (mode === "earliest") return "Earliest batch";
  if (mode === "random") return "Random mix";
  return "Latest batch";
}

