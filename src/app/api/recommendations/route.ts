import { NextRequest, NextResponse } from "next/server";
import { getSimilarBooks, getPersonalizedRecommendations } from "@/lib/recommend/engine";
import { db, client, userBooks, users, works } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const limit = parseInt(searchParams.get("limit") || "8", 10);

    // If a book slug is specified, return similar books for that specific work
    if (slug) {
      const similar = getSimilarBooks(slug, limit);
      return NextResponse.json({
        bookSlug: slug,
        similar,
      });
    }

    // Otherwise, fetch shelved books for the community member or guest
    let shelvedSlugs: string[] = [];
    try {
      await client.waitReady;
      const guestUser = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.displayName, "Community Reader"))
        .limit(1);

      if (guestUser.length > 0) {
        const rows = await db
          .select({ slug: works.slug })
          .from(userBooks)
          .innerJoin(works, eq(userBooks.workId, works.id))
          .where(eq(userBooks.userId, guestUser[0].id));

        shelvedSlugs = rows.map((r) => r.slug);
      }
    } catch (dbErr) {
      console.warn("Recommendations DB query fallback:", dbErr);
    }

    const reco = getPersonalizedRecommendations(shelvedSlugs, limit);
    return NextResponse.json(reco);
  } catch (error) {
    console.error("GET /api/recommendations error:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { shelvedSlugs = [], limit = 8 } = body;

    const reco = getPersonalizedRecommendations(shelvedSlugs, limit);
    return NextResponse.json(reco);
  } catch (error) {
    console.error("POST /api/recommendations error:", error);
    return NextResponse.json(
      { error: "Failed to process personalized recommendation request" },
      { status: 500 }
    );
  }
}
