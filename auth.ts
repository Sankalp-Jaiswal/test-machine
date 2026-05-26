import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { authConfig } from "@/auth.config";

/**
 * Full NextAuth instance — Node runtime only. Adds MongoDB adapter for user
 * persistence and a Credentials provider for email/password login. JWT sessions
 * so middleware can stay edge-safe.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    ...authConfig.providers,
    Credentials({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        const email = String(creds?.email ?? "").trim().toLowerCase();
        const password = String(creds?.password ?? "");
        if (!email || !password) return null;

        const client = await clientPromise;
        const users = client.db().collection("users");
        const user = await users.findOne<{
          _id: { toString(): string };
          email: string;
          name?: string;
          image?: string;
          password?: string;
          role?: "admin" | "student";
        }>({ email });

        if (!user?.password) return null;

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name ?? null,
          image: user.image ?? null,
          role: user.role === "admin" ? "admin" : "student",
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      const base = authConfig.callbacks?.jwt
        ? await authConfig.callbacks.jwt({ token, user, trigger } as any)
        : token;
      if (user?.role) {
        base.role = user.role;
      }
      if (!base.role && base.id) {
        try {
          const client = await clientPromise;
          const users = client.db().collection("users");
          const dbUser = await users.findOne<{ role?: "admin" | "student" }>({
            _id: new ObjectId(String(base.id)),
          });
          base.role = dbUser?.role === "admin" ? "admin" : "student";
        } catch (_) {
          base.role = "student";
        }
      }
      return base;
    },
    async session({ session, token, user }) {
      const s = authConfig.callbacks?.session
        ? await authConfig.callbacks.session({ session, token, user } as any)
        : session;
      if (s.user) {
        s.user.role = (token?.role as "admin" | "student") || "student";
      }
      return s;
    },
  },
  events: {
    async createUser({ user }) {
      try {
        const client = await clientPromise;
        const users = client.db().collection("users");
        await users.updateOne(
          { _id: new ObjectId(String(user.id)) },
          { $set: { role: "student" } },
        );
      } catch (_) {
        // ignore
      }
    },
  },
});
