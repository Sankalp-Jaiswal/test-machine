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
