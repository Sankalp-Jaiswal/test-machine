"use client";

import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Brain, Home, Upload, Settings, Sparkles } from "lucide-react";
import { UserMenu } from "@/components/UserMenu";

const NAV_ITEMS = [
  { name: "Dashboard", path: "/", icon: Home },
  { name: "Import", path: "/import", icon: Upload },
  { name: "Admin", path: "/admin", icon: Settings },
];

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  return (
    <nav className="sticky top-0 z-40 border-b border-border/60 bg-background/60 backdrop-blur-xl">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.button
            onClick={() => router.push("/")}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 cursor-pointer group ring-focus rounded-xl"
          >
            <div className="relative">
              <div className="absolute -inset-1 gradient-brand rounded-xl blur-md opacity-50 group-hover:opacity-80 transition-opacity" />
              <div className="relative p-2 gradient-brand rounded-xl">
                <Brain className="w-5 h-5 text-white" strokeWidth={2.4} />
              </div>
            </div>
            <div className="hidden sm:flex flex-col text-left leading-tight">
              {/* <p className="text-sm font-bold tracking-tight text-foreground">
                CIL MT <span className="gradient-text">Prep Arena</span>
              </p> */}
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Smart exam workspace
              </p>
            </div>
          </motion.button>

          {/* Nav Items */}
          <div className="hidden md:flex items-center gap-1 glass rounded-full px-1 py-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.path);
              return (
                <motion.button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className={`relative px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 transition-colors ring-focus ${
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  whileTap={{ scale: 0.96 }}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active-pill"
                      className="absolute inset-0 rounded-full bg-primary/20 ring-1 ring-primary/40"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <item.icon className="w-4 h-4 relative" />
                  <span className="relative">{item.name}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Right slot */}
          <div className="flex items-center gap-2">
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="hidden lg:flex items-center gap-2 text-xs font-medium text-muted-foreground glass px-3 py-1.5 rounded-full"
            >
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>Dark · v1</span>
            </motion.div>

            <UserMenu />

            {/* Mobile icons */}
            <div className="md:hidden flex items-center gap-1 glass rounded-full p-1">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.path);
                return (
                  <motion.button
                    key={item.path}
                    onClick={() => router.push(item.path)}
                    aria-label={item.name}
                    className={`p-2 rounded-full transition-colors ring-focus ${
                      active
                        ? "bg-primary/20 text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    whileTap={{ scale: 0.9 }}
                  >
                    <item.icon className="w-4 h-4" />
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
