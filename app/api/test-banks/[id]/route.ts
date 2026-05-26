import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { auth } from "@/auth";
import { isAdminUser } from "@/lib/authz";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const isAdmin = await isAdminUser(session?.user?.id);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const client = await clientPromise;
    const db = client.db();
    const col = db.collection("testBanks");
    const result = await col.deleteOne({ id });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
