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
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Dashboard", path: "/", icon: Home },
  { name: "Practice", path: "/practice", icon: Layers },
  { name: "My Attempts", path: "/profile", icon: User },
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
