import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/mongodb";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

type RouteContext = { params: Promise<{ id: string }> };
const allowedStatuses = ["Open", "In Progress", "Closed"];

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const params = await context.params;
    const id = params.id;
    const body = await req.json();
    const { status } = body;
    if (!status) return NextResponse.json({ error: "Missing status" }, { status: 400 });
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const db = await getDb();

    const res = await db.collection("jobRequests").updateOne({ _id: new ObjectId(id) }, { $set: { status } });
    return NextResponse.json({ ok: true, modified: res.modifiedCount });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  try {
    const params = await context.params;
    const id = params.id;
    const db = await getDb();
    const res = await db.collection("jobRequests").deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ ok: true, deleted: res.deletedCount });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
