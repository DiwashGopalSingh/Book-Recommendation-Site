import { NextRequest, NextResponse } from "next/server";
import { sessionReader } from "@/lib/session";
import { ingestOpenSourceBooks } from "@/lib/catalog/ingest";

export async function POST(req: NextRequest) {
  const reader = await sessionReader(req);
  if (!reader) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (reader.accountType !== "admin") return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  const raw = req.nextUrl.searchParams.get("count") ?? "60";
  const count = Number(raw);
  if (!/^\d+$/.test(raw) || count < 1 || count > 150) {
    return NextResponse.json({ error: "count must be an integer from 1 to 150" }, { status: 400 });
  }
  try {
    const inserted = await ingestOpenSourceBooks(count);
    return NextResponse.json({ success: true, inserted });
  } catch (error) {
    console.error("Catalog import failed", error);
    return NextResponse.json({ error: "Catalog import failed" }, { status: 500 });
  }
}
