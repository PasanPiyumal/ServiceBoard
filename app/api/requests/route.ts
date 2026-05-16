import { NextResponse } from "next/server";
import { getDb } from "../../../lib/mongodb";
import jwt from "jsonwebtoken";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const mine = url.searchParams.get("mine");
    const q = url.searchParams.get("q")?.trim() || "";
    const status = url.searchParams.get("status")?.trim() || "all";
    const page = Number(url.searchParams.get("page") || "1");
    const limit = Math.min(100, Number(url.searchParams.get("limit") || "10"));
    const sortParam = url.searchParams.get("sort") || "newest";

    let filter: any = {};
    if (mine === "true") {
      const auth = req.headers.get("authorization") || "";
      if (!auth.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const token = auth.split(" ")[1];
      const secret = process.env.JWT_SECRET || "dev-secret";
      const decoded: any = jwt.verify(token, secret);
      filter = { "createdBy.id": decoded.id };
    }

    if (status && status !== "all") {
      filter.status = status;
    }

    const searchTerms = q
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    function escapeRegExp(value: string) {
      return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    if (searchTerms.length) {
      filter.$and = searchTerms.map((term) => ({
        $or: [
          { title: { $regex: escapeRegExp(term), $options: "i" } },
          { description: { $regex: escapeRegExp(term), $options: "i" } },
          { category: { $regex: escapeRegExp(term), $options: "i" } },
          { location: { $regex: escapeRegExp(term), $options: "i" } },
          { contactName: { $regex: escapeRegExp(term), $options: "i" } },
          { contactEmail: { $regex: escapeRegExp(term), $options: "i" } },
          { status: { $regex: escapeRegExp(term), $options: "i" } },
        ],
      }));
    }

    const db = await getDb();
    // The assessment expects a single `jobRequests` collection for all request records.
    const col = db.collection("jobRequests");

    // Map client sort param to a Mongo sort object.
    let sortObj: any = { createdAt: -1 };
    if (sortParam === "oldest") sortObj = { createdAt: 1 };
    else if (sortParam === "status") sortObj = { status: 1, createdAt: -1 };
    else if (sortParam === "category") sortObj = { category: 1, createdAt: -1 };

    const skip = Math.max(0, (page - 1) * limit);
    const cursor = col.find(filter).sort(sortObj).skip(skip).limit(limit);
    const list = await cursor.toArray();
    const total = await col.countDocuments(filter);
    return NextResponse.json({ ok: true, data: list, total, page, limit });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, category, location, contactName, contactEmail, status } = body;
    const normalizedStatus = ["Open", "In Progress", "Closed"].includes(status) ? status : "Open";

    if (!title || !description || !category || !location || !contactEmail) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (!/^\S+@\S+\.\S+$/.test(String(contactEmail))) {
      return NextResponse.json({ error: "Invalid contact email" }, { status: 400 });
    }

    // optional auth: check Authorization header
    let createdBy = null;
    try {
      const auth = req.headers.get("authorization") || "";
      if (auth.startsWith("Bearer ")) {
        const token = auth.split(" ")[1];
        const secret = process.env.JWT_SECRET || "dev-secret";
        const decoded: any = jwt.verify(token, secret);
        createdBy = { id: decoded.id, name: decoded.name, email: decoded.email };
      }
    } catch (e) {
      // ignore token errors; allow anonymous create
    }

    const db = await getDb();
    const now = new Date();
    const res = await db.collection("jobRequests").insertOne({
      title,
      description,
      category,
      location,
      contactName: contactName || null,
      contactEmail,
      createdBy,
      // Keep the submitted status in the database, defaulting to Open when omitted.
      status: normalizedStatus,
      createdAt: now,
    });

    return NextResponse.json({ ok: true, id: res.insertedId.toString() });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
