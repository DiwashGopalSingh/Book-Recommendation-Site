import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { NextRequest } from "next/server";
import { getDatabase, readerSessions, users } from "./db";

export const sessionCookie = "cl_session";
export const sessionLifetime = 7 * 24 * 60 * 60;
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

export async function issueSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const db = await getDatabase();
  await db.insert(readerSessions).values({
    tokenHash: hash(token), userId, expiresAt: new Date(Date.now() + sessionLifetime * 1000),
  });
  return token;
}

export async function sessionReader(req: NextRequest) {
  const token = req.cookies.get(sessionCookie)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const db = await getDatabase();
  const [reader] = await db.select({ id: users.id, accountType: users.accountType, name: users.displayName, email: users.email })
    .from(readerSessions).innerJoin(users, eq(readerSessions.userId, users.id))
    .where(and(eq(readerSessions.tokenHash, hash(token)), gt(readerSessions.expiresAt, new Date()), eq(users.status, "active")));
  return reader ?? null;
}

export async function revokeSession(req: NextRequest) {
  const token = req.cookies.get(sessionCookie)?.value;
  if (!token) return;
  const db = await getDatabase();
  await db.delete(readerSessions).where(eq(readerSessions.tokenHash, hash(token)));
}
