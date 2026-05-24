"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useEffect, type ReactNode } from "react";
import { useAppStore } from "@/store/useAppStore";

function SessionSync() {
  const { status } = useSession();
  useEffect(() => {
    if (status === "authenticated" || status === "unauthenticated") {
      // re-pull from the server whenever the auth state resolves or flips
      useAppStore.getState().loadFromStorage();
    }
  }, [status]);
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <SessionSync />
      {children}
    </SessionProvider>
  );
}
