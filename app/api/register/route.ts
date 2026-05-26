import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import clientPromise from "@/lib/mongodb";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const { name, email: rawEmail, password } = await request.json();
    const email = String(rawEmail ?? "").trim().toLowerCase();

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
    }
    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const users = client.db().collection("users");

    const existing = await users.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { error: "An account with that email already exists." },
        { status: 409 },
      );
    }

    const hashed = await bcrypt.hash(password, 12);

    await users.insertOne({
      name: name ? String(name).slice(0, 80) : null,
      email,
      password: hashed,
      role: "student",
      emailVerified: null,
      image: null,
      createdAt: new Date(),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
