"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  GitPullRequest,
  Search,
  X,
  FileText,
  Clock,
  CheckCircle,
  HelpCircle,
  FileDown,
  History,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  User,
  Mail,
  Calendar,
  Layers,
  ArrowRightLeft
} from "lucide-react";
import toast from "react-hot-toast";
import { RequestDocument, Question } from "@/types";

export function AdminRequestsDashboard() {
  const [requests, setRequests] = useState<RequestDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  // Selected Detail Request
  const [selectedRequest, setSelectedRequest] = useState<RequestDocument | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Review Remarks
  const [adminRemarks, setAdminRemarks] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchAdminRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (typeFilter !== "all") params.append("type", typeFilter);
      if (searchQuery) params.append("search", searchQuery);
      params.append("sort", sortOrder);

      const res = await fetch(`/api/requests?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (e) {
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, typeFilter, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAdminRequests();
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === "pending").length;
    const underReview = requests.filter((r) => r.status === "under_review").length;
    const approved = requests.filter((r) => r.status === "approved").length;
    const rejected = requests.filter((r) => r.status === "rejected").length;
    return { total, pending, underReview, approved, rejected };
  }, [requests]);

  // Submit Review
  const handleSubmitReview = async (status: "approved" | "rejected" | "requires_changes") => {
    if (!selectedRequest) return;
    
    if ((status === "rejected" || status === "requires_changes") && !adminRemarks.trim()) {
      toast.error("Remarks / comments are required when rejecting or requesting changes");
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/requests/${selectedRequest.requestNumber}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, remarks: adminRemarks.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Request ${selectedRequest.requestNumber} reviewed as: ${status}!`);
        setDetailOpen(false);
        setSelectedRequest(null);
        setAdminRemarks("");
        fetchAdminRequests();
      } else {
        toast.error(data.error || "Review submission failed");
      }
    } catch (_) {
      toast.error("An error occurred");
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-success bg-success/10 border-success/30";
      case "rejected":
        return "text-destructive bg-destructive/10 border-destructive/30";
      case "requires_changes":
        return "text-warning bg-warning/10 border-warning/30";
      case "under_review":
        return "text-accent bg-accent/10 border-accent/30";
      default:
        return "text-muted-foreground bg-secondary/80 border-border/60";
    }
  };

  return (
    <div className="ambient-bg space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs text-muted-foreground mb-3">
          <GitPullRequest className="w-3.5 h-3.5 text-primary" />
          Admin Request Queue
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          Pending & Historical Suggestions
        </h1>
        <p className="text-muted-foreground text-sm max-w-xl leading-relaxed">
          Manage user suggested content, evaluate test submissions, and approve questions for production.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="glass rounded-2xl p-5 border-border/60 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Total Requests</p>
            <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">{stats.total}</p>
          </div>
          <div className="p-2.5 bg-secondary/80 border border-border/30 rounded-lg text-muted-foreground">
            <GitPullRequest className="w-4 h-4" />
          </div>
        </Card>
        <Card className="glass rounded-2xl p-5 border-border/60 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Pending Approval</p>
            <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">{stats.pending}</p>
          </div>
          <div className="p-2.5 bg-accent/15 border border-accent/20 rounded-lg text-accent">
            <Clock className="w-4 h-4" />
          </div>
        </Card>
        <Card className="glass rounded-2xl p-5 border-border/60 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Under Review</p>
            <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">{stats.underReview}</p>
          </div>
          <div className="p-2.5 bg-primary/10 border border-primary/20 rounded-lg text-primary">
            <RotateCcw className="w-4 h-4" />
          </div>
        </Card>
        <Card className="glass rounded-2xl p-5 border-border/60 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Approved</p>
            <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">{stats.approved}</p>
          </div>
          <div className="p-2.5 bg-success/10 border border-success/20 rounded-lg text-success">
            <CheckCircle className="w-4 h-4" />
          </div>
        </Card>
        <Card className="glass rounded-2xl p-5 border-border/60 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Rejected</p>
            <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">{stats.rejected}</p>
          </div>
          <div className="p-2.5 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
            <ThumbsDown className="w-4 h-4" />
          </div>
        </Card>
      </div>

      {/* Filter and search bar */}
      <Card className="glass rounded-2xl p-4 border-border/60">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by Request #, Submitter Name or Email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background border-border/70 text-foreground"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-lg border border-border/70 bg-background text-sm text-foreground ring-focus focus:border-primary"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="requires_changes">Requires Changes</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 px-3 rounded-lg border border-border/70 bg-background text-sm text-foreground ring-focus focus:border-primary"
          >
            <option value="all">All Types</option>
            <option value="create_paper">Create Paper</option>
            <option value="add_questions">Add Questions</option>
            <option value="general">General</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="h-10 px-3 rounded-lg border border-border/70 bg-background text-sm text-foreground ring-focus focus:border-primary"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
          <Button type="submit" variant="outline" className="border-border/60 text-foreground">
            Search
          </Button>
        </form>
      </Card>

      {/* Requests table list */}
      <Card className="glass rounded-2xl border-border/60 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-sm text-muted-foreground">Loading queue suggestions...</div>
        ) : requests.length === 0 ? (
          <div className="py-20 text-center">
            <GitPullRequest className="mx-auto w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-semibold text-foreground">No suggestions in queue</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Suggested changes submitted by users will display here for your inspection.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-secondary/30 text-muted-foreground font-mono text-[10px] uppercase tracking-wider">
                  <th className="p-4">Request #</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Title</th>
                  <th className="p-4">Submitted</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {requests.map((r) => (
                  <tr key={r.requestNumber} className="hover:bg-secondary/20 transition-colors group">
                    <td className="p-4 font-mono font-semibold text-foreground text-xs">{r.requestNumber}</td>
                    <td className="p-4 capitalize text-xs">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-border/60 bg-secondary/40 text-muted-foreground">
                        {r.type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-4 max-w-[150px] truncate text-xs">
                      <span className="font-semibold text-foreground block">{r.userName}</span>
                      <span className="text-muted-foreground block truncate">{r.userEmail}</span>
                    </td>
                    <td className="p-4 font-semibold text-foreground max-w-[200px] truncate" title={r.title}>
                      {r.title}
                    </td>
                    <td className="p-4 text-muted-foreground text-xs">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${getStatusColor(r.status)}`}>
                        {r.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedRequest(r);
                          setAdminRemarks(r.adminRemarks || "");
                          setDetailOpen(true);
                        }}
                        className="text-xs text-primary font-semibold hover:underline"
                      >
                        Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Inspect Request Detail Modal */}
      <AnimatePresence>
        {detailOpen && selectedRequest && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/80 backdrop-blur-xs" onClick={() => setDetailOpen(false)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="relative w-full max-w-2xl bg-card border-l border-border h-full flex flex-col shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-border/60 flex justify-between items-center bg-secondary/20">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-foreground">{selectedRequest.requestNumber}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${getStatusColor(selectedRequest.status)}`}>
                      {selectedRequest.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Submitted on {new Date(selectedRequest.createdAt).toLocaleString()} · v{selectedRequest.version || 1}</p>
                </div>
                <button onClick={() => setDetailOpen(false)} className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Submitter Box */}
                <Card className="p-4 border-border/60 bg-secondary/10 flex items-start gap-4">
                  <div className="p-2 bg-primary/10 border border-primary/20 rounded-xl text-primary shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Requested By</p>
                    <p className="text-sm font-semibold text-foreground">{selectedRequest.userName}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" /> {selectedRequest.userEmail}
                    </p>
                  </div>
                </Card>

                {/* Main details */}
                <div>
                  <h4 className="text-sm font-bold text-foreground mb-2">Request Subject</h4>
                  <p className="text-sm text-foreground bg-secondary/20 border border-border/40 p-3 rounded-xl font-semibold">
                    {selectedRequest.title}
                  </p>
                </div>

                {/* Custom payload details based on request type */}
                {selectedRequest.type === "create_paper" && (
                  <div>
                    <h4 className="text-sm font-bold text-foreground mb-3">Paper Configuration</h4>
                    <div className="grid grid-cols-2 gap-4 rounded-xl border border-border/40 bg-secondary/15 p-4 text-xs">
                      <div>
                        <span className="text-muted-foreground">Test Name</span>
                        <p className="font-semibold text-foreground mt-0.5">{selectedRequest.payload.testName}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Duration</span>
                        <p className="font-semibold text-foreground mt-0.5">{selectedRequest.payload.duration} Minutes</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h5 className="text-xs font-bold text-foreground mb-2">Questions ({selectedRequest.payload.questions?.length || 0})</h5>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {selectedRequest.payload.questions?.map((q, idx) => (
                          <div key={idx} className="rounded-xl border border-border/40 bg-background p-3 text-xs">
                            <div className="flex justify-between items-start gap-2">
                              <p className="font-semibold text-foreground">Q{idx + 1}. {q.question}</p>
                              <span className="px-2 py-0.5 rounded bg-secondary text-muted-foreground font-mono uppercase text-[9px]">
                                {q.difficulty}
                              </span>
                            </div>
                            <ul className="grid grid-cols-2 gap-2 mt-2 font-medium text-muted-foreground text-[11px]">
                              <li>A: {q.options.A}</li>
                              <li>B: {q.options.B}</li>
                              <li>C: {q.options.C}</li>
                              <li>D: {q.options.D}</li>
                            </ul>
                            <div className="mt-2 border-t border-border/40 pt-2 flex justify-between items-center text-[10px]">
                              <span className="text-success font-semibold">Correct Answer: {q.correctAnswer}</span>
                              <span className="text-muted-foreground">{q.section}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {selectedRequest.type === "add_questions" && (
                  <div>
                    <h4 className="text-sm font-bold text-foreground mb-3">Target Paper: {selectedRequest.payload.testName}</h4>
                    <div>
                      <h5 className="text-xs font-bold text-foreground mb-2">Suggested Questions ({selectedRequest.payload.newQuestions?.length || 0})</h5>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {selectedRequest.payload.newQuestions?.map((q, idx) => (
                          <div key={idx} className="rounded-xl border border-border/40 bg-background p-3 text-xs">
                            <div className="flex justify-between items-start gap-2">
                              <p className="font-semibold text-foreground">Q{idx + 1}. {q.question}</p>
                              <span className="px-2 py-0.5 rounded bg-secondary text-muted-foreground font-mono uppercase text-[9px]">
                                {q.difficulty}
                              </span>
                            </div>
                            <ul className="grid grid-cols-2 gap-2 mt-2 font-medium text-muted-foreground text-[11px]">
                              <li>A: {q.options.A}</li>
                              <li>B: {q.options.B}</li>
                              <li>C: {q.options.C}</li>
                              <li>D: {q.options.D}</li>
                            </ul>
                            <div className="mt-2 border-t border-border/40 pt-2 flex justify-between items-center text-[10px]">
                              <span className="text-success font-semibold">Correct: {q.correctAnswer}</span>
                              <span className="text-muted-foreground">{q.section}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {selectedRequest.type === "general" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 rounded-xl border border-border/40 bg-secondary/15 p-4 text-xs">
                      <div>
                        <span className="text-muted-foreground">Category</span>
                        <p className="font-semibold text-foreground mt-0.5 capitalize">{selectedRequest.payload.category?.replace("_", " ")}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Attached Document</span>
                        <p className="font-semibold text-foreground mt-0.5 truncate flex items-center gap-1">
                          {selectedRequest.payload.attachmentName ? (
                            <>
                              <FileDown className="w-3.5 h-3.5 text-primary" /> {selectedRequest.payload.attachmentName}
                            </>
                          ) : (
                            "None"
                          )}
                        </p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground mb-1.5">Detailed Description</h4>
                      <p className="text-sm text-foreground bg-secondary/10 border border-border/40 p-4 rounded-xl leading-relaxed whitespace-pre-wrap">
                        {selectedRequest.payload.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Audit Trail Timeline */}
                <div>
                  <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <History className="w-4 h-4 text-muted-foreground" /> Audit Trail & History
                  </h4>
                  <div className="border-l-2 border-border/60 ml-2.5 pl-5 space-y-4 text-xs">
                    {selectedRequest.history?.map((h, idx) => (
                      <div key={idx} className="relative">
                        <div className="absolute -left-[27px] top-1 w-2.5 h-2.5 rounded-full border border-border bg-background ring-4 ring-background shrink-0" />
                        <div className="flex justify-between items-center text-[10px] text-muted-foreground font-semibold">
                          <span>{h.action.toUpperCase()}</span>
                          <span>{new Date(h.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="font-medium text-foreground mt-0.5">{h.changedBy}</p>
                        {h.remarks && (
                          <p className="text-muted-foreground mt-1 italic border-l border-border/60 pl-2 text-[11px] bg-secondary/10 py-1 pr-2 rounded">
                            "{h.remarks}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Review Form - only show if request is not already resolved */}
                {(selectedRequest.status === "pending" || selectedRequest.status === "under_review") && (
                  <div className="space-y-4 pt-6 border-t border-border/60">
                    <div className="space-y-2">
                      <Label className="font-bold text-foreground">Reviewer Remarks / Feedback</Label>
                      <Textarea
                        value={adminRemarks}
                        onChange={(e) => setAdminRemarks(e.target.value)}
                        placeholder="Add comments, changes requested, or approval note..."
                        className="h-24 bg-background border-border/70 resize-none text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        onClick={() => handleSubmitReview("approved")}
                        disabled={submittingReview}
                        className="bg-success hover:bg-success/90 text-white text-xs font-semibold gap-1.5 h-9"
                      >
                        <ThumbsUp className="w-4 h-4" /> Approve
                      </Button>
                      <Button
                        onClick={() => handleSubmitReview("requires_changes")}
                        disabled={submittingReview}
                        className="bg-warning hover:bg-warning/90 text-white text-xs font-semibold gap-1.5 h-9"
                      >
                        <RotateCcw className="w-4 h-4" /> Request Changes
                      </Button>
                      <Button
                        onClick={() => handleSubmitReview("rejected")}
                        disabled={submittingReview}
                        className="bg-destructive hover:bg-destructive/90 text-white text-xs font-semibold gap-1.5 h-9"
                      >
                        <ThumbsDown className="w-4 h-4" /> Reject
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-5 border-t border-border/60 bg-secondary/10">
                <Button variant="outline" className="w-full" onClick={() => setDetailOpen(false)}>
                  Close Details
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
