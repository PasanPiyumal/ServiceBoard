import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getDb } from "../../../../lib/mongodb";

function getAuthUserId(req: Request) {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const token = auth.split(" ")[1];
  const secret = process.env.JWT_SECRET || "dev-secret";
  const decoded: any = jwt.verify(token, secret);
  return decoded.id as string;
}

export async function GET(req: Request) {
  try {
    const userId = getAuthUserId(req);
    const db = await getDb();
    const requests = await db
      .collection("jobRequests")
      .find({ "createdBy.id": userId })
      .sort({ createdAt: -1 })
      .toArray();

    const total = requests.length;
    const open = requests.filter((request: any) => (request.status || "Open") === "Open").length;
    const inProgress = requests.filter((request: any) => request.status === "In Progress").length;
    const closed = requests.filter((request: any) => request.status === "Closed").length;
    const categories = new Set(requests.map((request: any) => request.category).filter(Boolean)).size;
    const locations = new Set(requests.map((request: any) => request.location).filter(Boolean)).size;
    const contacts = new Set(requests.map((request: any) => request.contactEmail).filter(Boolean)).size;

    return NextResponse.json({
      ok: true,
      data: { total, open, inProgress, closed, categories, locations, contacts },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 401 });
  }
}