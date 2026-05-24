import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { auth } from "@/auth";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const client = await clientPromise;
    const db = client.db();
    const col = db.collection("testBanks");
    const docs = await col
      .find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .toArray();
    return NextResponse.json(docs);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db();
    const col = db.collection("testBanks");
    // server is the source of truth for ownership
    await col.insertOne({ ...body, userId: session.user.id });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
