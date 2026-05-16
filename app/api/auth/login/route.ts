import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// POST /api/auth/login
export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const db = await getDb();
    const user = await db.collection("users").findOne({ email });
    if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const secret = process.env.JWT_SECRET || "dev-secret";
    const token = jwt.sign({ id: user._id.toString(), email: user.email, name: user.name }, secret, {
      expiresIn: "7d",
    });

    return NextResponse.json({ ok: true, token, user: { name: user.name, email: user.email } });
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
