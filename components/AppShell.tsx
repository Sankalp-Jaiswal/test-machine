"use client";

import { useEffect, useState } from "react";
import { Sidebar, MobileTopBar } from "@/components/Sidebar";
import { UserMenu } from "@/components/UserMenu";
import { NotificationCenter } from "@/components/NotificationCenter";

const COLLAPSE_KEY = "prep-arena-sidebar-collapsed";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COLLAPSE_KEY);
      if (stored === "1") setCollapsed(true);
    } catch (_) {
      // ignore
    }
    setHydrated(true);
  }, []);

  const toggle = () => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch (_) {
        // ignore
      }
      return next;
    });
  };

  // Reserve horizontal space for the sidebar on lg+ screens. Until hydration
  // resolves the stored collapsed state, default to expanded width so SSR
  // markup matches the most common case.
  const mainOffset = hydrated && collapsed ? "lg:pl-[96px]" : "lg:pl-[248px]";

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapsed={toggle}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className={`flex min-h-screen flex-col transition-[padding] duration-200 ${mainOffset}`}>
        <MobileTopBar onOpen={() => setMobileOpen(true)} />
        <div className="hidden lg:flex h-16 items-center justify-end border-b border-sidebar-border bg-background px-6 xl:px-8 gap-4">
          <NotificationCenter />
          <UserMenu />
        </div>
        <main className="flex-1 min-h-0 w-full">
          <div className="h-full w-full px-4 py-4 sm:px-6 lg:px-8 lg:py-6 xl:px-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
