"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, LogOut, User as UserIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export function UserMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openMenu = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setOpen(true);
  };

  const closeMenu = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setOpen(false);
      closeTimer.current = null;
    }, 120);
  };

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) {
        clearTimeout(closeTimer.current);
      }
    };
  }, []);

  if (status === "loading") {
    return <div className="h-8 w-24 rounded-full skeleton-shimmer" />;
  }

  if (!session?.user) {
    return (
      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/" })}
        className="inline-flex items-center gap-2 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium px-4 py-1.5 transition-colors ring-focus"
      >
        <LogIn className="w-4 h-4" />
        Sign in
      </button>
    );
  }

  const initial =
    (session.user.name || session.user.email || "?").slice(0, 1).toUpperCase();

  return (
    <div
      className="relative"
      ref={ref}
      onMouseEnter={openMenu}
      onMouseLeave={closeMenu}
    >
      <button
        type="button"
        className="flex items-center gap-2 rounded-full pl-1.5 pr-3 py-1 glass hover:border-primary/50 transition-colors ring-focus"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="relative inline-grid place-items-center w-7 h-7 rounded-full gradient-brand text-white text-xs font-semibold overflow-hidden">
          {session.user.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name || "User"}
              fill
              sizes="28px"
              className="object-cover"
            />
          ) : (
            initial
          )}
        </span>
        <span className="hidden sm:inline text-xs font-medium text-foreground max-w-[120px] truncate">
          {session.user.name || session.user.email}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.2, 0.8, 0.2, 1] }}
            className="absolute right-0 top-[calc(100%+8px)] w-64 origin-top-right glass-strong rounded-2xl p-2 shadow-2xl z-50"
            role="menu"
          >
            <div className="px-3 py-3 border-b border-border/60">
              <p className="text-sm font-semibold text-foreground truncate">
                {session.user.name || "Signed in"}
              </p>
              {session.user.email && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {session.user.email}
                </p>
              )}
            </div>
            <div className="py-1.5 text-xs text-muted-foreground px-3 flex items-center gap-2">
              <UserIcon className="w-3.5 h-3.5" /> Your data is private
            </div>
            {/* Developer credit */}
            <div className="mx-2 mt-1 mb-1 px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/40">
              <p className="text-[10px] text-muted-foreground font-medium mb-1.5 uppercase tracking-wider">Developed by</p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">Sankalp</span>
                <div className="flex items-center gap-2">
                  <a
                    href="https://www.linkedin.com/in/sankalp-jaiswal-new/"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="LinkedIn"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center w-6 h-6 rounded-md bg-[#0077B5]/10 hover:bg-[#0077B5]/25 text-[#0077B5] transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-label="LinkedIn"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  </a>
                  <a
                    href="https://www.instagram.com/sankalp.0210/"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Instagram"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center w-6 h-6 rounded-md bg-pink-500/10 hover:bg-pink-500/25 text-pink-500 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-label="Instagram"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                  </a>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                signOut({ callbackUrl: "/" });
              }}
              className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors ring-focus"
              role="menuitem"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
