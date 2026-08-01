import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { auth } from "@/auth";
import { isAdminUser } from "@/lib/authz";
import { RequestDocument, RequestStatus } from "@/types";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const isAdmin = await isAdminUser(session?.user?.id);
  if (!isAdmin || !session?.user?.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { status, remarks } = body;

    const allowedStatuses: RequestStatus[] = ["approved", "rejected", "requires_changes"];
    if (!status || !allowedStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status transition" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const requestsCol = db.collection("requests");
    const testBanksCol = db.collection("testBanks");
    const notificationsCol = db.collection("notifications");

    const query = id.toUpperCase().startsWith("REQ-") 
      ? { requestNumber: id.toUpperCase() } 
      : { id };

    const requestDoc = await requestsCol.findOne<RequestDocument>(query);
    if (!requestDoc) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (requestDoc.status === "approved" || requestDoc.status === "rejected") {
      return NextResponse.json({ error: "Cannot review an already resolved request" }, { status: 400 });
    }

    const userName = session.user.name || "Admin";
    const userEmail = session.user.email || "";

    const updatedHistory = [
      ...(requestDoc.history || []),
      {
        status,
        action: status,
        timestamp: Date.now(),
        changedBy: `${userName} (${userEmail})`,
        remarks: remarks || `Status updated to ${status}`
      }
    ];

    // Handle database operations if approved
    if (status === "approved") {
      if (requestDoc.type === "create_paper") {
        const { testName, duration, questions } = requestDoc.payload;
        // Verify unique test ID
        const testId = `test_${Date.now()}`;
        await testBanksCol.insertOne({
          id: testId,
          testName: testName || "Approved Test",
          duration: duration || 30,
          questions: (questions || []).map((q, idx) => ({
            ...q,
            id: q.id || idx + 1
          })),
          createdAt: Date.now(),
          userId: requestDoc.userId // set requester as original creator
        });
      } else if (requestDoc.type === "add_questions") {
        const { testId, newQuestions } = requestDoc.payload;
        if (!testId || !newQuestions || newQuestions.length === 0) {
          return NextResponse.json({ error: "Malformed payload inside request" }, { status: 400 });
        }

        const testBank = await testBanksCol.findOne({ id: testId });
        if (!testBank) {
          return NextResponse.json({ error: "Target test bank no longer exists" }, { status: 404 });
        }

        const existingQuestions = testBank.questions || [];
        const maxId = existingQuestions.reduce((max: number, q: any) => Math.max(max, q.id || 0), 0);
        
        const preparedQuestions = newQuestions.map((q: any, idx: number) => ({
          ...q,
          id: maxId + idx + 1
        }));

        await testBanksCol.updateOne(
          { id: testId },
          { $push: { questions: { $each: preparedQuestions } } as any }
        );
      }
    }

    // Update Request Status in DB
    await requestsCol.updateOne(query, {
      $set: {
        status,
        adminRemarks: remarks || null,
        reviewedBy: session.user.id,
        reviewedAt: Date.now(),
        updatedAt: Date.now(),
        history: updatedHistory
      }
    });

    // Notify original user
    let notificationType = "under_review";
    let notificationMessage = `Your request ${requestDoc.requestNumber} is under review.`;

    if (status === "approved") {
      notificationType = "approved";
      notificationMessage = `Congratulations! Your request ${requestDoc.requestNumber} ("${requestDoc.title}") has been approved and is now live.`;
    } else if (status === "rejected") {
      notificationType = "rejected";
      notificationMessage = `Your request ${requestDoc.requestNumber} ("${requestDoc.title}") was rejected.${remarks ? ` Reason: ${remarks}` : ""}`;
    } else if (status === "requires_changes") {
      notificationType = "changes_requested";
      notificationMessage = `Action required: Your request ${requestDoc.requestNumber} ("${requestDoc.title}") requires changes.${remarks ? ` Comments: ${remarks}` : ""}`;
    }

    await notificationsCol.insertOne({
      userId: requestDoc.userId,
      requestNumber: requestDoc.requestNumber,
      type: notificationType,
      message: notificationMessage,
      read: false,
      createdAt: Date.now()
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
