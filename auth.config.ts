import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

const googleClientId = process.env.AUTH_GOOGLE_ID;
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET;

/**
 * Edge-safe NextAuth config — no DB adapter, no Node-only modules.
 * Imported by middleware (edge runtime) and re-used by the full auth.ts.
 */
export const authConfig = {
  providers:
    googleClientId && googleClientSecret
      ? [
          Google({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          }),
        ]
      : [],
  pages: { signIn: "/signin" },
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      if (user?.role) token.role = user.role;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token?.id) {
        session.user.id = token.id as string;
      }
      if (session.user && token?.role) {
        session.user.role = token.role as "admin" | "student";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
