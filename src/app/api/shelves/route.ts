import { NextRequest, NextResponse } from "next/server";
import {
  getAllShelvedBooks,
  getShelfItem,
  mutateShelfItem,
} from "@/lib/catalog/shelfStore";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug") || searchParams.get("workSlug");
    const workId = searchParams.get("workId");

    const target = slug || workId;

    // Single book status check
    if (target) {
      const entry = await getShelfItem(target);
      return NextResponse.json({ entry });
    }

    // Return all shelved books
    const shelves = await getAllShelvedBooks();
    return NextResponse.json({ shelves, total: shelves.length });
  } catch (error) {
    console.error("GET /api/shelves error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve shelves" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workSlug, slug, workId, status, rating, privateNote } = body;
    const targetSlug = workSlug || slug || workId;

    if (!targetSlug) {
      return NextResponse.json(
        { error: "Book slug or ID is required" },
        { status: 400 }
      );
    }

    const result = await mutateShelfItem({
      slug: targetSlug,
      status,
      rating,
      privateNote,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/shelves error:", error);
    return NextResponse.json(
      { error: "Failed to update shelf" },
      { status: 500 }
    );
  }
}
