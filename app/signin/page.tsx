"use client";

import { signIn, useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  Brain,
  ShieldCheck,
  Sparkles,
  Loader2,
  Mail,
  Lock,
  User as UserIcon,
  AlertCircle,
  X,
} from "lucide-react";

type Mode = "signin" | "signup";

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen ambient-bg bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <SignInPageInner />
    </Suspense>
  );
}

function GoogleLogo({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#4285F4"
        d="M21.6 12.227c0-.682-.061-1.337-.175-1.964H12v3.72h5.385a4.604 4.604 0 0 1-1.998 3.018v2.508h3.235c1.893-1.743 2.978-4.31 2.978-7.282Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.964-.895 6.621-2.49l-3.235-2.509c-.896.6-2.042.953-3.386.953-2.604 0-4.808-1.757-5.595-4.122H3.063v2.59A9.997 9.997 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.405 13.832a5.984 5.984 0 0 1 0-3.665V7.578H3.063a10 10 0 0 0 0 8.844l3.342-2.59Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.96c1.467 0 2.785.504 3.82 1.493l2.866-2.866C16.96 2.992 14.695 2 12 2A9.997 9.997 0 0 0 3.063 7.578l3.342 2.59C7.192 7.717 9.396 5.96 12 5.96Z"
      />
    </svg>
  );
}

function SignInPageInner() {
  const router = useRouter();
  const search = useSearchParams();
  const callbackUrl = search.get("callbackUrl") || "/";
  const errorParam = search.get("error");
  const { status } = useSession();

  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") router.replace(callbackUrl);
  }, [status, callbackUrl, router]);

  useEffect(() => {
    if (errorParam) {
      setError(
        errorParam === "OAuthAccountNotLinked"
          ? "An account with this email already exists with a different provider."
          : errorParam === "CredentialsSignin"
          ? "Invalid email or password."
          : "Sign-in failed. Please try again.",
      );
    }
  }, [errorParam]);

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
          redirect: "error",
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.ok) {
          throw new Error(data?.error || "Could not create account.");
        }
      }
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });
      if (!result || result.error) {
        throw new Error("Invalid email or password.");
      }
      router.replace(result.url || callbackUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen ambient-bg bg-background flex items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
        className="w-full max-w-md"
      >
        <div className="glass rounded-3xl border-border/60 p-8 md:p-10 relative overflow-hidden">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="absolute top-4 right-4 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-background/70 text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary/60"
            aria-label="Close sign in"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-accent/15 blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-3 mb-8">
              <div className="relative">
                <div className="absolute -inset-1 gradient-brand rounded-xl blur-md opacity-60" />
                <div className="relative p-2 gradient-brand rounded-xl">
                  <Brain className="w-5 h-5 text-white" strokeWidth={2.4} />
                </div>
              </div>
              <div>
                <p className="text-sm font-bold tracking-tight text-foreground">
                  CIL MT <span className="gradient-text">Prep Arena</span>
                </p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Smart exam workspace
                </p>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              {mode === "signin"
                ? "Sign in to save your test banks, attempts, and performance analytics across devices."
                : "Get a private workspace for your test banks, attempts, and analytics."}
            </p>

            {/* Tabs */}
            <div className="mt-6 flex p-1 rounded-full glass">
              {(["signin", "signup"] as Mode[]).map((m) => {
                const active = mode === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setMode(m);
                      setError(null);
                    }}
                    className={`relative flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ring-focus ${
                      active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="signin-tab-pill"
                        className="absolute inset-0 rounded-full bg-primary/20 ring-1 ring-primary/40"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                    <span className="relative">
                      {m === "signin" ? "Sign in" : "Create account"}
                    </span>
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {error && (
                <motion.div
                  key={error}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="mt-5 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-sm px-4 py-3 flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleCredentialsSubmit} className="mt-6 space-y-3">
              {mode === "signup" && (
                <Field
                  icon={UserIcon}
                  type="text"
                  placeholder="Your name (optional)"
                  value={name}
                  onChange={setName}
                  autoComplete="name"
                />
              )}
              <Field
                icon={Mail}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={setEmail}
                autoComplete="email"
                required
              />
              <Field
                icon={Lock}
                type="password"
                placeholder={mode === "signup" ? "Choose a password (min 8 chars)" : "Your password"}
                value={password}
                onChange={setPassword}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                required
                minLength={mode === "signup" ? 8 : undefined}
              />
              <button
                type="submit"
                disabled={submitting}
                className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-full gradient-brand text-white text-sm font-semibold px-5 py-3 hover:opacity-90 transition-opacity ring-focus disabled:opacity-70"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {mode === "signin" ? "Sign in" : "Create account & sign in"}
              </button>
            </form>

            <div className="flex items-center gap-3 my-6">
              <div className="h-px flex-1 bg-border/60" />
              <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                or
              </span>
              <div className="h-px flex-1 bg-border/60" />
            </div>

            <button
              type="button"
              disabled={googleSubmitting}
              onClick={async () => {
                setGoogleSubmitting(true);
                await signIn("google", { callbackUrl });
              }}
              className="w-full inline-flex items-center justify-center gap-3 rounded-full bg-white text-zinc-900 text-sm font-semibold px-5 py-3 hover:bg-zinc-100 transition-colors ring-focus disabled:opacity-70"
            >
              {googleSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <GoogleLogo />
              )}
              Continue with Google
            </button>

            <div className="mt-8 grid grid-cols-1 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-success" />
                Your data is private to your account
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                Tests, attempts and analytics sync across devices
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-6">
          By continuing you agree to be a good test-taker · No spam · Sign out
          anytime
        </p>
      </motion.div>
    </div>
  );
}

function Field({
  icon: Icon,
  type,
  placeholder,
  value,
  onChange,
  required,
  autoComplete,
  minLength,
}: {
  icon: React.ElementType;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  autoComplete?: string;
  minLength?: number;
}) {
  return (
    <label className="relative block">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
        <Icon className="w-4 h-4" />
      </span>
      {/* eslint-disable-next-line jsx-a11y/autocomplete-valid */}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete ?? "off"}
        minLength={minLength}
        className="w-full rounded-xl bg-secondary/40 border border-border/60 hover:border-border focus:border-primary/60 focus:ring-2 focus:ring-primary/30 transition-all text-sm text-foreground placeholder:text-muted-foreground/70 pl-10 pr-3.5 py-2.5 outline-none"
      />
    </label>
  );
}
