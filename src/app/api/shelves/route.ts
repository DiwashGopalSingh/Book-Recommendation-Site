import { NextRequest, NextResponse } from "next/server";
import { db, userBooks, users, works } from "@/lib/db";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workId = searchParams.get("workId");

    // For demo/community guest session, get or create a default guest member
    let guestUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.displayName, "Community Reader"))
      .limit(1);

    if (guestUser.length === 0) {
      const [created] = await db
        .insert(users)
        .values({
          displayName: "Community Reader",
          accountType: "member",
          audienceCeiling: "all",
          interfaceLanguage: "en",
        })
        .returning({ id: users.id });
      guestUser = [created];
    }

    const userId = guestUser[0].id;

    if (workId) {
      const entry = await db
        .select()
        .from(userBooks)
        .where(and(eq(userBooks.userId, userId), eq(userBooks.workId, workId)))
        .limit(1);

      return NextResponse.json({ entry: entry[0] || null });
    }

    // Return all books shelved by user
    const allShelved = await db
      .select({
        id: userBooks.id,
        workId: userBooks.workId,
        status: userBooks.status,
        rating: userBooks.rating,
        privateNote: userBooks.privateNote,
        title: works.title,
        slug: works.slug,
      })
      .from(userBooks)
      .innerJoin(works, eq(userBooks.workId, works.id))
      .where(eq(userBooks.userId, userId));

    return NextResponse.json({ shelves: allShelved });
  } catch (error) {
    console.error("GET /api/shelves error:", error);
    return NextResponse.json({ error: "Failed to retrieve shelves" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workId, workSlug, status, rating, privateNote } = body;

    if (!workId && !workSlug) {
      return NextResponse.json({ error: "workId or workSlug required" }, { status: 400 });
    }

    // Resolve workId if workSlug is provided
    let targetWorkId = workId;
    if (!targetWorkId && workSlug) {
      const found = await db
        .select({ id: works.id })
        .from(works)
        .where(eq(works.slug, workSlug))
        .limit(1);
      if (found.length === 0) {
        return NextResponse.json({ error: "Work not found" }, { status: 404 });
      }
      targetWorkId = found[0].id;
    }

    // Resolve or create community guest member
    let guestUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.displayName, "Community Reader"))
      .limit(1);

    if (guestUser.length === 0) {
      const [created] = await db
        .insert(users)
        .values({
          displayName: "Community Reader",
          accountType: "member",
          audienceCeiling: "all",
          interfaceLanguage: "en",
        })
        .returning({ id: users.id });
      guestUser = [created];
    }

    const userId = guestUser[0].id;

    // Check existing
    const existing = await db
      .select({ id: userBooks.id })
      .from(userBooks)
      .where(and(eq(userBooks.userId, userId), eq(userBooks.workId, targetWorkId)))
      .limit(1);

    if (status === null || status === "remove") {
      // Remove from shelf
      if (existing.length > 0) {
        await db.delete(userBooks).where(eq(userBooks.id, existing[0].id));
      }
      return NextResponse.json({ success: true, removed: true });
    }

    if (existing.length > 0) {
      // Update
      const [updated] = await db
        .update(userBooks)
        .set({
          status,
          rating: rating !== undefined ? rating : undefined,
          privateNote: privateNote !== undefined ? privateNote : undefined,
          updatedAt: new Date(),
        })
        .where(eq(userBooks.id, existing[0].id))
        .returning();

      return NextResponse.json({ success: true, entry: updated });
    } else {
      // Insert
      const [inserted] = await db
        .insert(userBooks)
        .values({
          userId,
          workId: targetWorkId,
          status,
          rating,
          privateNote,
        })
        .returning();

      return NextResponse.json({ success: true, entry: inserted });
    }
  } catch (error) {
    console.error("POST /api/shelves error:", error);
    return NextResponse.json({ error: "Failed to update shelf" }, { status: 500 });
  }
}
