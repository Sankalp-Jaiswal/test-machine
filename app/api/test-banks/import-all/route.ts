import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { auth } from "@/auth";
import { isAdminUser } from "@/lib/authz";

export const runtime = "nodejs";

/**
 * Development helper: copy all existing testBanks into the authenticated
 * user's account. This is intentionally gated to development or when
 * ADMIN_IMPORT=true is present in env to avoid accidental exposure.
 */
export async function POST() {
  const session = await auth();
  const isAdmin = await isAdminUser(session?.user?.id);
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (process.env.NODE_ENV !== "development" && process.env.ADMIN_IMPORT !== "true") {
    return NextResponse.json({ error: "Import disabled" }, { status: 403 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const col = db.collection("testBanks");

    const all = await col.find({}).toArray();

    if (!all || all.length === 0) {
      return NextResponse.json({ ok: true, imported: 0 });
    }

    let imported = 0;
    for (const doc of all) {
      // avoid re-importing documents already owned by this user
      if (String(doc.userId) === String(session.user.id)) continue;

      // generate a new id so we don't collide; preserve original createdAt
      const newDoc = {
        ...doc,
        id: `imported_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        userId: session.user.id,
      };
      // remove _id so Mongo assigns new one
      delete (newDoc as any)._id;
      await col.insertOne(newDoc as any);
      imported += 1;
    }

    return NextResponse.json({ ok: true, imported });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
