import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Edge-safe NextAuth config — no DB adapter, no Node-only modules.
 * Imported by middleware (edge runtime) and re-used by the full auth.ts.
 */
export const authConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  pages: { signIn: "/signin" },
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token?.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
