import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { auth } from "@/auth";
import { isAdminUser } from "@/lib/authz";
import { RequestDocument } from "@/types";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const client = await clientPromise;
    const db = client.db();
    const requestsCol = db.collection("requests");

    // Match by requestNumber or _id if necessary. We should query by requestNumber mostly.
    const query = id.toUpperCase().startsWith("REQ-") 
      ? { requestNumber: id.toUpperCase() } 
      : { id };

    const requestDoc = await requestsCol.findOne<RequestDocument>(query);
    if (!requestDoc) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const isAdmin = await isAdminUser(session.user.id);
    if (!isAdmin && requestDoc.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(requestDoc);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { payload, resubmissionNote } = body;

    if (!payload) {
      return NextResponse.json({ error: "Missing payload" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const requestsCol = db.collection("requests");
    const notificationsCol = db.collection("notifications");

    const query = id.toUpperCase().startsWith("REQ-") 
      ? { requestNumber: id.toUpperCase() } 
      : { id };

    const requestDoc = await requestsCol.findOne<RequestDocument>(query);
    if (!requestDoc) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Only the creator can edit their request
    if (requestDoc.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Can only edit if status requires changes
    if (requestDoc.status !== "requires_changes") {
      return NextResponse.json({ error: "Request cannot be edited unless changes are requested" }, { status: 400 });
    }

    const nextVersion = (requestDoc.version || 1) + 1;
    const userName = session.user.name || "Anonymous";
    const userEmail = session.user.email || "";

    const updatedHistory = [
      ...(requestDoc.history || []),
      {
        status: "pending" as const,
        action: "resubmitted",
        timestamp: Date.now(),
        changedBy: `${userName} (${userEmail})`,
        remarks: resubmissionNote || `Resubmitted (v${nextVersion})`
      }
    ];

    // Re-verify payload based on request type
    let title = requestDoc.title;
    if (requestDoc.type === "create_paper") {
      if (!payload.testName || !payload.questions || !Array.isArray(payload.questions)) {
        return NextResponse.json({ error: "Invalid paper payload settings or questions" }, { status: 400 });
      }
      title = `Create Saved Paper: ${payload.testName}`;
    } else if (requestDoc.type === "add_questions") {
      if (!payload.newQuestions || !Array.isArray(payload.newQuestions) || payload.newQuestions.length === 0) {
        return NextResponse.json({ error: "Must submit at least one question" }, { status: 400 });
      }
      title = `Add Questions to: ${payload.testName || "Unknown Paper"}`;
    } else if (requestDoc.type === "general") {
      if (!payload.subject || !payload.description) {
        return NextResponse.json({ error: "Subject and Description are required" }, { status: 400 });
      }
      title = `General Request: ${payload.subject}`;
    }

    await requestsCol.updateOne(query, {
      $set: {
        title,
        status: "pending",
        version: nextVersion,
        payload,
        updatedAt: Date.now(),
        history: updatedHistory
      }
    });

    // Notify user of successful resubmission
    await notificationsCol.insertOne({
      userId: session.user.id,
      requestNumber: requestDoc.requestNumber,
      type: "submitted",
      message: `Your request ${requestDoc.requestNumber} has been updated and resubmitted (v${nextVersion}).`,
      read: false,
      createdAt: Date.now()
    });

    return NextResponse.json({ ok: true, version: nextVersion });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
