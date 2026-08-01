import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { auth } from "@/auth";
import { isAdminUser } from "@/lib/authz";
import { getNextRequestNumber } from "@/lib/requests";
import { RequestDocument, RequestType } from "@/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const type = url.searchParams.get("type");
    const search = url.searchParams.get("search")?.trim();
    const sort = url.searchParams.get("sort") || "newest";

    const client = await clientPromise;
    const db = client.db();
    const requestsCol = db.collection("requests");

    const isAdmin = await isAdminUser(session.user.id);
    const query: any = {};

    // Enforce student scoping
    if (!isAdmin) {
      query.userId = session.user.id;
    }

    // Apply status filter
    if (status && status !== "all") {
      query.status = status;
    }

    // Apply type filter
    if (type && type !== "all") {
      query.type = type;
    }

    // Apply search filter (Search by Request Number, title, user name, or email)
    if (search) {
      const escapedSearch = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
      const searchRegex = new RegExp(escapedSearch, "i");
      
      // If matches request format exactly, query specifically
      if (search.toUpperCase().startsWith("REQ-")) {
        query.requestNumber = search.toUpperCase();
      } else {
        query.$or = [
          { requestNumber: searchRegex },
          { title: searchRegex },
          { userName: searchRegex },
          { userEmail: searchRegex }
        ];
      }
    }

    // Sorting
    const sortOrder = sort === "oldest" ? 1 : -1;
    const docs = await requestsCol
      .find(query)
      .sort({ createdAt: sortOrder })
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
    const { type, payload } = body;

    if (!type || !payload) {
      return NextResponse.json({ error: "Missing required fields (type, payload)" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const requestsCol = db.collection("requests");
    const notificationsCol = db.collection("notifications");

    // Dynamic title building & validations based on request type
    let title = "General Request";
    if (type === "create_paper") {
      if (!payload.testName || !payload.questions || !Array.isArray(payload.questions)) {
        return NextResponse.json({ error: "Invalid paper payload settings or questions" }, { status: 400 });
      }
      title = `Create Saved Paper: ${payload.testName}`;
    } else if (type === "add_questions") {
      if (!payload.newQuestions || !Array.isArray(payload.newQuestions) || payload.newQuestions.length === 0) {
        return NextResponse.json({ error: "Must submit at least one question" }, { status: 400 });
      }
      title = `Add Questions to: ${payload.testName || "Unknown Paper"}`;
    } else if (type === "general") {
      if (!payload.subject || !payload.description) {
        return NextResponse.json({ error: "Subject and Description are required" }, { status: 400 });
      }
      title = `General Request: ${payload.subject}`;
    } else {
      return NextResponse.json({ error: "Unsupported request type" }, { status: 400 });
    }

    // Atomic generated ID
    const requestNumber = await getNextRequestNumber(db);

    const userName = session.user.name || "Anonymous";
    const userEmail = session.user.email || "";

    const newRequest: RequestDocument = {
      requestNumber,
      type: type as RequestType,
      title,
      status: "pending",
      userId: session.user.id,
      userName,
      userEmail,
      version: 1,
      payload,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      history: [
        {
          status: "pending",
          action: "created",
          timestamp: Date.now(),
          changedBy: `${userName} (${userEmail})`,
          remarks: "Request submitted successfully"
        }
      ]
    };

    await requestsCol.insertOne(newRequest as any);

    // Create user notification
    await notificationsCol.insertOne({
      userId: session.user.id,
      requestNumber,
      type: "submitted",
      message: `Your request ${requestNumber} for "${title}" has been submitted and is pending review.`,
      read: false,
      createdAt: Date.now()
    });

    return NextResponse.json({ ok: true, requestNumber });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
