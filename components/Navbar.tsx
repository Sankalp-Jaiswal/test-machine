"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Brain, Home, Upload, Settings } from "lucide-react";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const navItems = [
    { name: "Dashboard", path: "/", icon: Home },
    { name: "Import Test", path: "/import", icon: Upload },
    { name: "Admin", path: "/admin", icon: Settings },
  ];

  return (
    <nav className="sticky top-0 z-40 border-b border-border/30 bg-card/30 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.button onClick={() => router.push("/")} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center gap-2 cursor-pointer group">
            <div className="p-2 bg-primary/20 rounded-lg group-hover:bg-primary/30 transition-colors">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div className="hidden sm:block">
              <p className="text-lg font-bold text-white">CIL MT Prep</p>
              <p className="text-xs text-muted-foreground">Arena</p>
            </div>
          </motion.button>

          {/* Nav Items */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <motion.button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`relative px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                  isActive(item.path) ? "text-primary" : "text-muted-foreground hover:text-white"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
                {isActive(item.path) && <motion.div layoutId="activeTab" className="absolute inset-0 bg-primary/10 rounded-lg -z-10" transition={{ type: "spring", stiffness: 500, damping: 30 }} />}
              </motion.button>
            ))}
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden flex items-center gap-2">
            {navItems.slice(0, 2).map((item) => (
              <motion.button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`p-2 rounded-lg transition-all ${isActive(item.path) ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-white"}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <item.icon className="w-5 h-5" />
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
