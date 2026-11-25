import { NextRequest, NextResponse } from "next/server";
import { searchCatalog } from "@/lib/catalog/search";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const audienceLevel = searchParams.get("audience") || undefined;
    const subject = searchParams.get("subject") || undefined;
    const sortBy = (searchParams.get("sort") as any) || "relevance";
    const rawLimit = searchParams.get("limit") ?? "24";
    const rawOffset = searchParams.get("offset") ?? "0";
    const limit = Number(rawLimit);
    const offset = Number(rawOffset);
    if (!/^\d+$/.test(rawLimit) || limit < 1 || limit > 500 ||
        !/^\d+$/.test(rawOffset) || !Number.isSafeInteger(offset)) {
      return NextResponse.json({ error: "Use a limit from 1 to 500 and a nonnegative integer offset." }, { status: 400 });
    }

    const startTime = Date.now();
    const data = await searchCatalog({
      query,
      audienceLevel,
      subject,
      sortBy,
      limit,
      offset,
    });
    const tookMs = Date.now() - startTime;

    return NextResponse.json({
      ...data,
      tookMs,
      query,
    });
  } catch (error) {
    console.error("GET /api/search error:", error);
    return NextResponse.json({ error: "Failed to perform catalog search" }, { status: 500 });
  }
}
