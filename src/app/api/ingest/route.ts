import { NextRequest, NextResponse } from "next/server";
import { ingestOpenSourceBooks } from "@/lib/catalog/ingest";

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const count = parseInt(searchParams.get("count") || "60", 10);

    console.log(`Received request to ingest ${count} open-source books...`);
    await ingestOpenSourceBooks(count);

    return NextResponse.json({
      success: true,
      message: `Successfully processed ingestion of up to ${count} open-source books from Project Gutenberg.`,
    });
  } catch (error) {
    console.error("POST /api/ingest error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Support quick GET trigger for easy testing
  return POST(req);
}
