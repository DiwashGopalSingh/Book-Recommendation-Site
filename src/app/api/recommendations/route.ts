import { getDiscoveryBooks } from "@/lib/catalog/discovery";
import { NextRequest, NextResponse } from "next/server";
import { getSimilarBooks, getPersonalizedRecommendations } from "@/lib/recommend/engine";
import { getAllShelvedBooks } from "@/lib/catalog/shelfStore";
import { sessionReader } from "@/lib/session";

async function recommendationShelf(req: NextRequest, guestSlugs: string[] = []) {
  const reader = await sessionReader(req);
  if (!reader) return guestSlugs;
  return (await getAllShelvedBooks(reader.id)).map(book => book.slug);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const limit = parseInt(searchParams.get("limit") || "8", 10);

    // If a book slug is specified, return similar books for that specific work
    if (slug) {
      const similar = getSimilarBooks(slug, limit, await getDiscoveryBooks());
      return NextResponse.json({
        bookSlug: slug,
        similar,
      });
    }

    const shelvedSlugs = await recommendationShelf(req);
    const reco = getPersonalizedRecommendations(shelvedSlugs, limit, undefined, await getDiscoveryBooks());
    return NextResponse.json(reco, { headers: { "Cache-Control": "private, no-store" } });
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
    const { limit = 8, preferences } = body;
    const shelvedSlugs = await recommendationShelf(req, body.shelvedSlugs);

    const reco = getPersonalizedRecommendations(shelvedSlugs, limit, preferences, await getDiscoveryBooks());
    return NextResponse.json(reco, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("POST /api/recommendations error:", error);
    return NextResponse.json(
      { error: "Failed to process personalized recommendation request" },
      { status: 500 }
    );
  }
}

