"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  GitPullRequest,
  Search,
  Plus,
  X,
  FileText,
  Clock,
  Layers,
  Gauge,
  ClipboardPaste,
  Upload,
  CheckCircle,
  HelpCircle,
  FileDown,
  History,
  AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";
import {
  extractQuestionsFromText,
  normalizeDifficulty,
  normalizeSection
} from "@/lib/fileParser";
import { RequestDocument, Question, Difficulty } from "@/types";

const ALL_CATEGORIES = [
  { value: "feature", label: "Feature Request" },
  { value: "incorrect_question", label: "Report Incorrect Question" },
  { value: "correction", label: "Content Correction" },
  { value: "technical", label: "Technical Issue" },
  { value: "suggestion", label: "Other Suggestion" }
];

export function UserRequestsDashboard() {
  const [requests, setRequests] = useState<RequestDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  // Escalate Request Modal
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [reqType, setReqType] = useState<"create_paper" | "add_questions" | "general">("create_paper");
  
  // Form States
  const [testName, setTestName] = useState("");
  const [duration, setDuration] = useState(30);
  const [inputText, setInputText] = useState("");
  const [parsedQuestions, setParsedQuestions] = useState<Question[]>([]);
  
  const [selectedTestId, setSelectedTestId] = useState("");
  const [generalSubject, setGeneralSubject] = useState("");
  const [generalCategory, setGeneralCategory] = useState<"feature" | "incorrect_question" | "correction" | "technical" | "suggestion">("feature");
  const [generalDescription, setGeneralDescription] = useState("");
  const [attachment, setAttachment] = useState<{ name: string; data: string } | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [parsing, setParsing] = useState(false);

  // Selected Detail Request
  const [selectedRequest, setSelectedRequest] = useState<RequestDocument | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Edit / Revision Panel
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [revisionNote, setRevisionNote] = useState("");
  const [editPayload, setEditPayload] = useState<any>(null);

  const testBanks = useAppStore((s) => s.testBanks);
  const realBanks = useMemo(() => testBanks.filter((b) => !b.id.startsWith("pooled_")), [testBanks]);

  const fetchUserRequests = async () => {
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
    fetchUserRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, typeFilter, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUserRequests();
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === "pending" || r.status === "under_review").length;
    const approved = requests.filter((r) => r.status === "approved").length;
    const changes = requests.filter((r) => r.status === "requires_changes").length;
    return { total, pending, approved, changes };
  }, [requests]);

  // File parsing for new paper / questions
  const handleParseText = async () => {
    if (!inputText.trim()) {
      toast.error("Please paste some text content containing questions first");
      return;
    }
    setParsing(true);
    try {
      const result = await extractQuestionsFromText(inputText, testName || "Suggested Paper");
      const mapped = result.questions.map((q: any, idx: number) => ({
        id: q.id || idx + 1,
        section: normalizeSection(q.section),
        difficulty: normalizeDifficulty(q.difficulty),
        question: q.question,
        options: q.options || { A: "", B: "", C: "", D: "" },
        correctAnswer: q.correctAnswer || "A",
        explanation: q.explanation || ""
      }));
      setParsedQuestions(mapped);
      toast.success(`Successfully parsed ${mapped.length} questions!`);
    } catch (e) {
      toast.error("Failed to parse text. Check format rules.");
    } finally {
      setParsing(false);
    }
  };

  // Handle file selection (JSON or Text)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setParsing(true);
      const text = await file.text();
      if (file.name.endsWith(".json")) {
        const parsed = JSON.parse(text);
        const qList = Array.isArray(parsed) ? parsed : (parsed.questions || []);
        const mapped = qList.map((q: any, idx: number) => ({
          id: q.id || idx + 1,
          section: normalizeSection(q.section),
          difficulty: normalizeDifficulty(q.difficulty),
          question: q.question,
          options: q.options || { A: "", B: "", C: "", D: "" },
          correctAnswer: q.correctAnswer || "A",
          explanation: q.explanation || ""
        }));
        setParsedQuestions(mapped);
        toast.success(`Parsed ${mapped.length} questions from JSON`);
      } else {
        setInputText(text);
        toast.success("File content loaded. Click 'Parse questions' to extract.");
      }
    } catch (_) {
      toast.error("Failed to read file");
    } finally {
      setParsing(false);
    }
  };

  // Handle General attachment upload
  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size cannot exceed 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachment({
        name: file.name,
        data: reader.result as string
      });
      toast.success("Attachment loaded successfully!");
    };
    reader.readAsDataURL(file);
  };

  // Submit Request
  const handleSubmitRequest = async () => {
    setSubmitting(true);
    try {
      let payload: any = {};
      if (reqType === "create_paper") {
        if (!testName.trim()) {
          toast.error("Please enter a paper name");
          setSubmitting(false);
          return;
        }
        if (parsedQuestions.length === 0) {
          toast.error("Please parse or load at least one question");
          setSubmitting(false);
          return;
        }
        payload = { testName: testName.trim(), duration, questions: parsedQuestions };
      } else if (reqType === "add_questions") {
        if (!selectedTestId) {
          toast.error("Select a target paper");
          setSubmitting(false);
          return;
        }
        if (parsedQuestions.length === 0) {
          toast.error("Please parse or load at least one question");
          setSubmitting(false);
          return;
        }
        const target = realBanks.find((b) => b.id === selectedTestId);
        payload = {
          testId: selectedTestId,
          testName: target?.testName || "",
          newQuestions: parsedQuestions
        };
      } else if (reqType === "general") {
        if (!generalSubject.trim() || !generalDescription.trim()) {
          toast.error("Please fill subject and description");
          setSubmitting(false);
          return;
        }
        payload = {
          subject: generalSubject.trim(),
          category: generalCategory,
          description: generalDescription.trim(),
          attachmentName: attachment?.name || undefined,
          attachmentData: attachment?.data || undefined
        };
      }

      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: reqType, payload })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Request ${data.requestNumber} submitted!`);
        setEscalateOpen(false);
        resetForm();
        fetchUserRequests();
      } else {
        toast.error(data.error || "Submission failed");
      }
    } catch (_) {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  // Resubmit Request
  const handleResubmitRequest = async () => {
    if (!selectedRequest) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/requests/${selectedRequest.requestNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: editPayload, revisionNote })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Request ${selectedRequest.requestNumber} updated & resubmitted!`);
        setRevisionOpen(false);
        setDetailOpen(false);
        setSelectedRequest(null);
        setRevisionNote("");
        fetchUserRequests();
      } else {
        toast.error(data.error || "Update failed");
      }
    } catch (_) {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTestName("");
    setDuration(30);
    setInputText("");
    setParsedQuestions([]);
    setSelectedTestId("");
    setGeneralSubject("");
    setGeneralCategory("feature");
    setGeneralDescription("");
    setAttachment(null);
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
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs text-muted-foreground mb-3">
            <GitPullRequest className="w-3.5 h-3.5 text-primary animate-pulse" />
            Request Workspace
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Suggest Changes & Content
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl leading-relaxed">
            Create new papers, add questions to existing banks, or submit requests for review.
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setReqType("create_paper");
            setEscalateOpen(true);
          }}
          className="rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold gap-1.5 h-10 px-5 shadow-xs"
        >
          <Plus className="w-4 h-4" /> Escalate Request
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Pending Review</p>
            <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">{stats.pending}</p>
          </div>
          <div className="p-2.5 bg-accent/10 border border-accent/20 rounded-lg text-accent">
            <Clock className="w-4 h-4" />
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
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Needs Attention</p>
            <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">{stats.changes}</p>
          </div>
          <div className="p-2.5 bg-warning/10 border border-warning/20 rounded-lg text-warning">
            <AlertCircle className="w-4 h-4" />
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
              placeholder="Search by Request Number..."
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
          <div className="py-20 text-center text-sm text-muted-foreground">Loading suggestions...</div>
        ) : requests.length === 0 ? (
          <div className="py-20 text-center">
            <GitPullRequest className="mx-auto w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-semibold text-foreground">No suggestions found</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Any change request you create will show up here along with status updates.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-secondary/30 text-muted-foreground font-mono text-[10px] uppercase tracking-wider">
                  <th className="p-4">Request #</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Title</th>
                  <th className="p-4">Last Updated</th>
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
                    <td className="p-4 font-semibold text-foreground max-w-[280px] truncate" title={r.title}>
                      {r.title}
                    </td>
                    <td className="p-4 text-muted-foreground text-xs">
                      {new Date(r.updatedAt || r.createdAt).toLocaleString()}
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
                          setDetailOpen(true);
                        }}
                        className="text-xs text-primary font-semibold hover:underline"
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Escalate Request Slide panel/modal */}
      <AnimatePresence>
        {escalateOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/80 backdrop-blur-xs" onClick={() => setEscalateOpen(false)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="relative w-full max-w-2xl bg-card border-l border-border h-full flex flex-col shadow-2xl overflow-hidden">
              {/* Modal header */}
              <div className="p-5 border-b border-border/60 flex justify-between items-center bg-secondary/20">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Escalate New Request</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Submit content changes to administrators</p>
                </div>
                <button onClick={() => setEscalateOpen(false)} className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Type Selection */}
                <div className="grid grid-cols-3 gap-2">
                  {(["create_paper", "add_questions", "general"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setReqType(t);
                        resetForm();
                      }}
                      className={`py-3 px-2 text-xs font-semibold rounded-xl border transition-all text-center flex flex-col items-center justify-center gap-1.5 ${
                        reqType === t
                          ? "border-primary/50 bg-primary/10 text-primary"
                          : "border-border/70 bg-background/50 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t === "create_paper" && (
                        <>
                          <FileText className="w-4 h-4" /> Create Paper
                        </>
                      )}
                      {t === "add_questions" && (
                        <>
                          <Plus className="w-4 h-4" /> Add Questions
                        </>
                      )}
                      {t === "general" && (
                        <>
                          <HelpCircle className="w-4 h-4" /> General Ticket
                        </>
                      )}
                    </button>
                  ))}
                </div>

                {/* Form Render based on type */}
                {reqType === "create_paper" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Paper Name</Label>
                      <Input
                        value={testName}
                        onChange={(e) => setTestName(e.target.value)}
                        placeholder="e.g. Computer Networks Test 1"
                        className="bg-background border-border/70"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Default Duration (minutes)</Label>
                      <Input
                        type="number"
                        min="1"
                        value={duration}
                        onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 30))}
                        className="bg-background border-border/70"
                      />
                    </div>
                    <QuestionsParsingBlock
                      inputText={inputText}
                      setInputText={setInputText}
                      parsedQuestions={parsedQuestions}
                      setParsedQuestions={setParsedQuestions}
                      onParse={handleParseText}
                      onFileUpload={handleFileUpload}
                      parsing={parsing}
                    />
                  </div>
                )}

                {reqType === "add_questions" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Select Target Paper</Label>
                      <select
                        value={selectedTestId}
                        onChange={(e) => setSelectedTestId(e.target.value)}
                        className="h-10 w-full rounded-lg border border-border/70 bg-background px-3 text-sm text-foreground ring-focus focus:border-primary"
                      >
                        <option value="">Select paper...</option>
                        {realBanks.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.testName} ({b.questions.length} Qs)
                          </option>
                        ))}
                      </select>
                    </div>
                    <QuestionsParsingBlock
                      inputText={inputText}
                      setInputText={setInputText}
                      parsedQuestions={parsedQuestions}
                      setParsedQuestions={setParsedQuestions}
                      onParse={handleParseText}
                      onFileUpload={handleFileUpload}
                      parsing={parsing}
                    />
                  </div>
                )}

                {reqType === "general" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <Input
                        value={generalSubject}
                        onChange={(e) => setGeneralSubject(e.target.value)}
                        placeholder="Brief summary of request"
                        className="bg-background border-border/70"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <select
                        value={generalCategory}
                        onChange={(e) => setGeneralCategory(e.target.value as any)}
                        className="h-10 w-full rounded-lg border border-border/70 bg-background px-3 text-sm text-foreground ring-focus focus:border-primary"
                      >
                        {ALL_CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={generalDescription}
                        onChange={(e) => setGeneralDescription(e.target.value)}
                        placeholder="Provide detailed description or feedback..."
                        className="h-32 bg-background border-border/70 resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Attachment (Optional)</Label>
                      <div className="rounded-xl border border-dashed border-border/80 p-5 text-center bg-background/50 hover:border-primary/50 transition-colors relative cursor-pointer">
                        <input
                          type="file"
                          accept=".png,.jpg,.jpeg,.pdf,.json,.txt"
                          onChange={handleAttachmentUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <Upload className="mx-auto w-6 h-6 text-muted-foreground mb-2" />
                        <p className="text-xs text-foreground font-semibold">
                          {attachment ? attachment.name : "Click to upload a file"}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">PNG, JPG, PDF, JSON up to 5MB</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal footer */}
              <div className="p-5 border-t border-border/60 flex gap-3 bg-secondary/10">
                <Button variant="outline" className="flex-1" onClick={() => setEscalateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitRequest} disabled={submitting} className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground">
                  {submitting ? "Submitting..." : "Submit for Approval"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                {/* Remarks Warning */}
                {selectedRequest.status === "requires_changes" && selectedRequest.adminRemarks && (
                  <Card className="border-warning/30 bg-warning/5 p-4 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-warning">Changes Required by Administrator</p>
                      <p className="text-xs text-foreground mt-1 font-medium">{selectedRequest.adminRemarks}</p>
                      <Button
                        size="sm"
                        onClick={() => {
                          setEditPayload(JSON.parse(JSON.stringify(selectedRequest.payload)));
                          setRevisionNote("");
                          setRevisionOpen(true);
                        }}
                        className="mt-3 bg-warning/20 hover:bg-warning/30 text-warning border border-warning/30 text-xs font-semibold"
                      >
                        Edit and Revise Suggestion
                      </Button>
                    </div>
                  </Card>
                )}

                {selectedRequest.status === "rejected" && selectedRequest.adminRemarks && (
                  <Card className="border-destructive/30 bg-destructive/5 p-4 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-destructive">Request Rejected</p>
                      <p className="text-xs text-foreground mt-1 font-medium">{selectedRequest.adminRemarks}</p>
                    </div>
                  </Card>
                )}

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

      {/* Revision / Edit panel Modal */}
      <AnimatePresence>
        {revisionOpen && selectedRequest && editPayload && (
          <div className="fixed inset-0 z-[60] flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/90 backdrop-blur-xs" onClick={() => setRevisionOpen(false)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="relative w-full max-w-2xl bg-card border-l border-border h-full flex flex-col shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-border/60 flex justify-between items-center bg-secondary/20">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Edit & Revise Request</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Modifying {selectedRequest.requestNumber}</p>
                </div>
                <button onClick={() => setRevisionOpen(false)} className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {selectedRequest.type === "create_paper" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Paper Name</Label>
                      <Input
                        value={editPayload.testName}
                        onChange={(e) => setEditPayload({ ...editPayload, testName: e.target.value })}
                        className="bg-background border-border/70"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Duration (minutes)</Label>
                      <Input
                        type="number"
                        value={editPayload.duration}
                        onChange={(e) => setEditPayload({ ...editPayload, duration: Math.max(1, parseInt(e.target.value) || 30) })}
                        className="bg-background border-border/70"
                      />
                    </div>
                    {/* Basic editor list for parsed questions */}
                    <div className="space-y-3">
                      <Label>Questions List</Label>
                      {editPayload.questions?.map((q: Question, idx: number) => (
                        <div key={idx} className="rounded-xl border border-border/60 p-4 space-y-3 bg-secondary/15">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-foreground">Question {idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const list = [...editPayload.questions];
                                list.splice(idx, 1);
                                setEditPayload({ ...editPayload, questions: list });
                              }}
                              className="text-xs text-destructive hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                          <Input
                            value={q.question}
                            onChange={(e) => {
                              const list = [...editPayload.questions];
                              list[idx].question = e.target.value;
                              setEditPayload({ ...editPayload, questions: list });
                            }}
                            placeholder="Question Text"
                            className="bg-background text-xs border-border/70"
                          />
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <Input
                              value={q.options.A}
                              onChange={(e) => {
                                const list = [...editPayload.questions];
                                list[idx].options.A = e.target.value;
                                setEditPayload({ ...editPayload, questions: list });
                              }}
                              placeholder="Option A"
                              className="bg-background text-xs border-border/70"
                            />
                            <Input
                              value={q.options.B}
                              onChange={(e) => {
                                const list = [...editPayload.questions];
                                list[idx].options.B = e.target.value;
                                setEditPayload({ ...editPayload, questions: list });
                              }}
                              placeholder="Option B"
                              className="bg-background text-xs border-border/70"
                            />
                            <Input
                              value={q.options.C}
                              onChange={(e) => {
                                const list = [...editPayload.questions];
                                list[idx].options.C = e.target.value;
                                setEditPayload({ ...editPayload, questions: list });
                              }}
                              placeholder="Option C"
                              className="bg-background text-xs border-border/70"
                            />
                            <Input
                              value={q.options.D}
                              onChange={(e) => {
                                const list = [...editPayload.questions];
                                list[idx].options.D = e.target.value;
                                setEditPayload({ ...editPayload, questions: list });
                              }}
                              placeholder="Option D"
                              className="bg-background text-xs border-border/70"
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <select
                              value={q.correctAnswer}
                              onChange={(e) => {
                                const list = [...editPayload.questions];
                                list[idx].correctAnswer = e.target.value as any;
                                setEditPayload({ ...editPayload, questions: list });
                              }}
                              className="h-8 rounded bg-background border border-border/70 text-xs px-2 text-foreground"
                            >
                              <option value="A">Correct: A</option>
                              <option value="B">Correct: B</option>
                              <option value="C">Correct: C</option>
                              <option value="D">Correct: D</option>
                            </select>
                            <Input
                              value={q.section}
                              onChange={(e) => {
                                const list = [...editPayload.questions];
                                list[idx].section = e.target.value;
                                setEditPayload({ ...editPayload, questions: list });
                              }}
                              placeholder="Section"
                              className="bg-background border-border/70 h-8"
                            />
                            <select
                              value={q.difficulty}
                              onChange={(e) => {
                                const list = [...editPayload.questions];
                                list[idx].difficulty = e.target.value as any;
                                setEditPayload({ ...editPayload, questions: list });
                              }}
                              className="h-8 rounded bg-background border border-border/70 text-xs px-2 text-foreground"
                            >
                              <option value="easy">Easy</option>
                              <option value="medium">Medium</option>
                              <option value="hard">Hard</option>
                            </select>
                          </div>
                          <Input
                            value={q.explanation}
                            onChange={(e) => {
                              const list = [...editPayload.questions];
                              list[idx].explanation = e.target.value;
                              setEditPayload({ ...editPayload, questions: list });
                            }}
                            placeholder="Explanation"
                            className="bg-background text-xs border-border/70 h-8"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedRequest.type === "add_questions" && (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <Label>Questions List</Label>
                      {editPayload.newQuestions?.map((q: Question, idx: number) => (
                        <div key={idx} className="rounded-xl border border-border/60 p-4 space-y-3 bg-secondary/15">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-foreground">Question {idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const list = [...editPayload.newQuestions];
                                list.splice(idx, 1);
                                setEditPayload({ ...editPayload, newQuestions: list });
                              }}
                              className="text-xs text-destructive hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                          <Input
                            value={q.question}
                            onChange={(e) => {
                              const list = [...editPayload.newQuestions];
                              list[idx].question = e.target.value;
                              setEditPayload({ ...editPayload, newQuestions: list });
                            }}
                            placeholder="Question Text"
                            className="bg-background text-xs border-border/70"
                          />
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <Input
                              value={q.options.A}
                              onChange={(e) => {
                                const list = [...editPayload.newQuestions];
                                list[idx].options.A = e.target.value;
                                setEditPayload({ ...editPayload, newQuestions: list });
                              }}
                              placeholder="Option A"
                              className="bg-background text-xs border-border/70"
                            />
                            <Input
                              value={q.options.B}
                              onChange={(e) => {
                                const list = [...editPayload.newQuestions];
                                list[idx].options.B = e.target.value;
                                setEditPayload({ ...editPayload, newQuestions: list });
                              }}
                              placeholder="Option B"
                              className="bg-background text-xs border-border/70"
                            />
                            <Input
                              value={q.options.C}
                              onChange={(e) => {
                                const list = [...editPayload.newQuestions];
                                list[idx].options.C = e.target.value;
                                setEditPayload({ ...editPayload, newQuestions: list });
                              }}
                              placeholder="Option C"
                              className="bg-background text-xs border-border/70"
                            />
                            <Input
                              value={q.options.D}
                              onChange={(e) => {
                                const list = [...editPayload.newQuestions];
                                list[idx].options.D = e.target.value;
                                setEditPayload({ ...editPayload, newQuestions: list });
                              }}
                              placeholder="Option D"
                              className="bg-background text-xs border-border/70"
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <select
                              value={q.correctAnswer}
                              onChange={(e) => {
                                const list = [...editPayload.newQuestions];
                                list[idx].correctAnswer = e.target.value as any;
                                setEditPayload({ ...editPayload, newQuestions: list });
                              }}
                              className="h-8 rounded bg-background border border-border/70 text-xs px-2 text-foreground"
                            >
                              <option value="A">Correct: A</option>
                              <option value="B">Correct: B</option>
                              <option value="C">Correct: C</option>
                              <option value="D">Correct: D</option>
                            </select>
                            <Input
                              value={q.section}
                              onChange={(e) => {
                                const list = [...editPayload.newQuestions];
                                list[idx].section = e.target.value;
                                setEditPayload({ ...editPayload, newQuestions: list });
                              }}
                              placeholder="Section"
                              className="bg-background border-border/70 h-8"
                            />
                            <select
                              value={q.difficulty}
                              onChange={(e) => {
                                const list = [...editPayload.newQuestions];
                                list[idx].difficulty = e.target.value as any;
                                setEditPayload({ ...editPayload, newQuestions: list });
                              }}
                              className="h-8 rounded bg-background border border-border/70 text-xs px-2 text-foreground"
                            >
                              <option value="easy">Easy</option>
                              <option value="medium">Medium</option>
                              <option value="hard">Hard</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedRequest.type === "general" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <Input
                        value={editPayload.subject}
                        onChange={(e) => setEditPayload({ ...editPayload, subject: e.target.value })}
                        className="bg-background border-border/70"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={editPayload.description}
                        onChange={(e) => setEditPayload({ ...editPayload, description: e.target.value })}
                        className="h-32 bg-background border-border/70 resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* Revision note from user */}
                <div className="space-y-2 pt-4 border-t border-border/60">
                  <Label>Resubmission Note / Message to Admin</Label>
                  <Input
                    value={revisionNote}
                    onChange={(e) => setRevisionNote(e.target.value)}
                    placeholder="e.g. Fixed the wording of question 3..."
                    className="bg-background border-border/70"
                  />
                </div>
              </div>

              <div className="p-5 border-t border-border/60 flex gap-3 bg-secondary/10">
                <Button variant="outline" className="flex-1" onClick={() => setRevisionOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleResubmitRequest} disabled={submitting} className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground">
                  {submitting ? "Updating..." : "Resubmit Suggestion"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-component Helper for Questions parsing block
function QuestionsParsingBlock({
  inputText,
  setInputText,
  parsedQuestions,
  setParsedQuestions,
  onParse,
  onFileUpload,
  parsing
}: {
  inputText: string;
  setInputText: (v: string) => void;
  parsedQuestions: Question[];
  setParsedQuestions: (list: Question[]) => void;
  onParse: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  parsing: boolean;
}) {
  return (
    <div className="space-y-4 pt-3 border-t border-border/60">
      <div className="flex items-center justify-between">
        <Label>Add Questions</Label>
        <span className="text-[10px] text-muted-foreground">JSON, PDF/TXT, or pasted text</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Label className="rounded-xl border border-border/70 bg-background/50 hover:bg-secondary/20 p-4 text-center cursor-pointer flex flex-col items-center justify-center gap-1 transition-colors h-24">
          <Upload className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">Upload file</span>
          <span className="text-[9px] text-muted-foreground">JSON, TXT, PDF, DOCX</span>
          <input
            type="file"
            accept=".json,.txt,.pdf,.docx"
            onChange={onFileUpload}
            className="hidden"
          />
        </Label>
        <div className="rounded-xl border border-border/70 bg-secondary/10 p-4 text-center flex flex-col items-center justify-center gap-1 h-24">
          <CheckCircle className="w-4 h-4 text-success" />
          <span className="text-xs font-semibold text-foreground">{parsedQuestions.length} Questions Loaded</span>
          {parsedQuestions.length > 0 && (
            <button type="button" onClick={() => setParsedQuestions([])} className="text-[9px] text-destructive hover:underline font-semibold">
              Clear Questions
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground">Or Paste Content (Q1. [Options] Ans: Exp: format)</Label>
        <Textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Section: Computer Networks\nDifficulty: Easy\n\nQ1. Default port of HTTP is:\nA) 20\nB) 21\nC) 80\nD) 443\nAns: C\nExp: HTTP uses port 80`}
          className="h-32 bg-background border-border/70 text-xs resize-none"
        />
        <Button
          type="button"
          onClick={onParse}
          disabled={parsing || !inputText}
          variant="secondary"
          className="w-full text-xs font-semibold"
        >
          {parsing ? "Parsing..." : "Parse Questions"}
        </Button>
      </div>

      {parsedQuestions.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs font-semibold">Parsed Questions Preview (Showing first 3)</Label>
          <div className="space-y-2">
            {parsedQuestions.slice(0, 3).map((q, idx) => (
              <div key={idx} className="rounded-lg border border-border/40 p-2.5 text-xs bg-background/50">
                <div className="flex justify-between items-start gap-2">
                  <p className="font-semibold text-foreground/90">Q{q.id}. {q.question}</p>
                  <span className="px-1.5 py-0.2 rounded bg-secondary text-muted-foreground uppercase text-[8px] font-mono">
                    {q.difficulty}
                  </span>
                </div>
                <div className="mt-1 flex justify-between items-center text-[10px] text-muted-foreground">
                  <span className="text-success font-semibold">Ans: {q.correctAnswer}</span>
                  <span>{q.section}</span>
                </div>
              </div>
            ))}
            {parsedQuestions.length > 3 && (
              <p className="text-[10px] text-muted-foreground text-center">+{parsedQuestions.length - 3} more questions loaded</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
