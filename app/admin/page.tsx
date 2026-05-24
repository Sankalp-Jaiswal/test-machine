"use client";

import { useAppStore } from "@/store/useAppStore";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Trash2, Edit2 } from "lucide-react";
import toast from "react-hot-toast";
import { useState } from "react";

export default function AdminPage() {
  const testBanks = useAppStore((state) => state.testBanks);
  const deleteTestBank = useAppStore((state) => state.deleteTestBank);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete "${name}"? This action cannot be undone.`)) {
      deleteTestBank(id);
      toast.success("Test bank deleted");
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background w-full">
        <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-8">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Test Management</h1>
            <p className="text-muted-foreground">Manage and organize your question banks</p>
          </motion.div>

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
      </main>
    </>
  );
}
