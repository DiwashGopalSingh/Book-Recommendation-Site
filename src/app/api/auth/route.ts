import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDatabase, users } from "@/lib/db";
import { issueSession, revokeSession, sessionCookie, sessionLifetime, sessionReader } from "@/lib/session";

const derive = promisify(scrypt);
const credentials = z.object({
  action: z.enum(["signup", "signin"]),
  email: z.email().max(320), password: z.string().min(1).max(1024),
  name: z.string().trim().max(150).optional(),
});
const privateHeaders = { "Cache-Control": "private, no-store" };

export async function GET(req: NextRequest) {
  const user = await sessionReader(req);
  return NextResponse.json({ user: user && { id: user.id, name: user.name, email: user.email } }, { headers: privateHeaders });
}

export async function POST(req: NextRequest) {
  const parsed = credentials.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
  const { action, password, name } = parsed.data;
  const email = parsed.data.email.toLowerCase();
  const db = await getDatabase();
  let reader;
  if (action === "signup") {
    const salt = randomBytes(16).toString("hex");
    const digest = await derive(password, salt, 64) as Buffer;
    [reader] = await db.insert(users).values({
      email, displayName: name || "Community Reader", passwordHash: salt + ":" + digest.toString("hex"),
    }).onConflictDoNothing({ target: users.email }).returning();
    if (!reader) return NextResponse.json({ error: "An account already uses this email." }, { status: 409 });
  } else {
    [reader] = await db.select().from(users).where(eq(users.email, email));
    const [salt, expected] = reader?.passwordHash?.split(":") ?? [];
    const actual = await derive(password, salt || "unregistered-reader", 64) as Buffer;
    if (reader?.status !== "active" || !expected || expected.length !== 128 ||
        !timingSafeEqual(actual, Buffer.from(expected, "hex"))) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }
  }
  await revokeSession(req);
  const token = await issueSession(reader.id);
  const response = NextResponse.json({ user: { name: reader.displayName, email: reader.email } }, { headers: privateHeaders });
  response.cookies.set(sessionCookie, token, { httpOnly: true, sameSite: "lax", secure: req.nextUrl.protocol === "https:", path: "/", maxAge: sessionLifetime });
  return response;
}

export async function DELETE(req: NextRequest) {
  await revokeSession(req);
  const response = NextResponse.json({ success: true }, { headers: privateHeaders });
  response.cookies.delete(sessionCookie);
  return response;
}
