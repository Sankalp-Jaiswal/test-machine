import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { auth } from "@/auth";
import { isAdminUser } from "@/lib/authz";

export const runtime = "nodejs";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const col = db.collection("testBanks");
    const docs = await col
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    return NextResponse.json(docs);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const isAdmin = await isAdminUser(session?.user?.id);
    if (!isAdmin) {
      return NextResponse.json({ error: "Only admins can import question banks." }, { status: 403 });
    }
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db();
    const col = db.collection("testBanks");
    await col.insertOne({
      ...body,
      userId: session?.user?.id ?? null,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
