import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// POST /api/auth/signup
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const db = await getDb();

    const existing = await db.collection("users").findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "User exists" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const res = await db
      .collection("users")
      .insertOne({ name, email, password: hashed, createdAt: new Date() });

    const secret = process.env.JWT_SECRET || "dev-secret";
    const token = jwt.sign(
      { id: res.insertedId.toString(), email, name },
      secret,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      ok: true,
      id: res.insertedId.toString(),
      token,
      user: { name, email },
    });
  } catch (err) {
    const message = String(err);
    if (message.includes("querySrv ENOTFOUND") || message.includes("MONGODB_URI")) {
      return NextResponse.json(
        {
          error:
            "Database connection failed. Check the MongoDB Atlas URI, DNS/network access, and Atlas IP access list.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
