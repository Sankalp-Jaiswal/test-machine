"use client";

import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Home,
  Layers,
  User,
  Settings,
  Menu,
  X,
  ChevronLeft,
  LogOut,
  GitPullRequest,
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Dashboard", path: "/", icon: Home },
  { name: "Practice", path: "/practice", icon: Layers },
  { name: "My Attempts", path: "/profile", icon: User },
  { name: "Requests", path: "/requests", icon: GitPullRequest },
  { name: "Settings", path: "/settings", icon: Settings },
];

type SidebarProps = {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
};

export function Sidebar({ collapsed, onToggleCollapsed, mobileOpen, onMobileClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  const width = collapsed ? "w-[96px]" : "w-[248px]";

  const inner = (
    <div className="h-full flex flex-col bg-sidebar border-r border-sidebar-border relative">
      {/* Brand */}
      <div className={`flex items-center gap-3 px-5 h-16 border-b border-sidebar-border ${collapsed ? "justify-center" : ""}`}>
        <div className="relative shrink-0">
          <div className="p-2 bg-primary rounded-xl flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary-foreground" strokeWidth={2.2} />
          </div>
        </div>
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <p className="text-sm font-semibold tracking-tight text-foreground truncate">
              Prep <span className="text-primary font-bold">Arena</span>
            </p>
            <p className="text-[10px] font-medium tracking-[0.14em] text-muted-foreground/80 uppercase">
              Smart workspace
            </p>
          </div>
        )}
        {/* Mobile close button */}
        <button
          type="button"
          onClick={onMobileClose}
          className="absolute top-2 right-2 lg:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors z-10"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => {
                router.push(item.path);
                onMobileClose();
              }}
              title={collapsed ? item.name : undefined}
              className={`group w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ring-focus ${
                active
                  ? "text-foreground bg-secondary font-semibold border-l-2 border-primary rounded-l-none"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-colors duration-150 ${active ? "text-primary" : "text-muted-foreground/70 group-hover:text-foreground"}`} />
              {!collapsed && <span className="truncate">{item.name}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer: collapse toggle */}
      <div className="border-t border-sidebar-border p-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="hidden lg:inline-flex p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors border border-transparent"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand" : "Collapse"}
        >
          <ChevronLeft className={`w-4 h-4 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`} />
        </button>
        {/* Developer credit - mobile */}
        <div className="lg:hidden px-3 pt-2 pb-1">
          <div className="rounded-xl bg-secondary/40 border border-border/40 px-3 py-2.5">
            <p className="text-[10px] text-muted-foreground font-medium mb-1.5 uppercase tracking-wider">Developed by</p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">Sankalp</span>
              <div className="flex items-center gap-2">
                <a
                  href="https://www.linkedin.com/in/sankalp-jaiswal-new/"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="LinkedIn"
                  className="flex items-center justify-center w-7 h-7 rounded-md bg-[#0077B5]/10 hover:bg-[#0077B5]/25 text-[#0077B5] transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-label="LinkedIn"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
                <a
                  href="https://www.instagram.com/sankalp.0210/"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Instagram"
                  className="flex items-center justify-center w-7 h-7 rounded-md bg-pink-500/10 hover:bg-pink-500/25 text-pink-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-label="Instagram"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                </a>
              </div>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            onMobileClose();
            signOut({ callbackUrl: "/" });
          }}
          className="lg:hidden w-full inline-flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors ring-focus"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex fixed inset-y-0 left-0 z-30 ${width} transition-[width] duration-200`}
      >
        {inner}
      </aside>

      {/* Mobile slide-in */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onMobileClose} />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="absolute inset-y-0 left-0 w-[280px]"
            >
              {inner}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function MobileTopBar({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="lg:hidden sticky top-0 z-20 h-14 flex items-center gap-3 px-4 border-b border-sidebar-border bg-sidebar/95 backdrop-blur-md shadow-xs">
      <button
        type="button"
        onClick={onOpen}
        className="p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-primary rounded-lg">
          <Brain className="w-4 h-4 text-primary-foreground" strokeWidth={2.2} />
        </div>
        <p className="text-sm font-semibold text-foreground">Prep Arena</p>
      </div>
    </div>
  );
}
