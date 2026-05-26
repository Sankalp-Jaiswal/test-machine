import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { auth } from "@/auth";
import { isAdminUser } from "@/lib/authz";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  const isAdmin = await isAdminUser(session?.user?.id);
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const client = await clientPromise;
    const users = client.db().collection("users");
    const docs = await users
      .find({})
      .project({ email: 1, name: 1, role: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .toArray();

    const sanitized = docs.map((u: any) => ({
      id: String(u._id),
      email: u.email || "",
      name: u.name || "",
      role: u.role === "admin" ? "admin" : "student",
      createdAt: u.createdAt || null,
    }));

    return NextResponse.json(sanitized);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
