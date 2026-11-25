import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAllShelvedBooks, mutateShelfItem } from "@/lib/catalog/shelfStore";
import { sessionReader } from "@/lib/session";

const headers = { "Cache-Control": "private, no-store" };
const unauthorized = () => NextResponse.json({ error: "Sign in to access your shelf." }, { status: 401, headers });
const mutation = z.object({
  slug: z.string().optional(), workSlug: z.string().optional(), workId: z.string().optional(),
  status: z.enum(["want_to_read", "reading", "read", "did_not_finish", "remove"]).nullable().optional(),
  rating: z.number().min(0).max(5).nullable().optional(), privateNote: z.string().nullable().optional(),
});

export async function GET(req: NextRequest) {
  const reader = await sessionReader(req);
  if (!reader) return unauthorized();
  const params = req.nextUrl.searchParams;
  const key = params.get("slug") || params.get("workSlug") || params.get("workId");
  const shelves = await getAllShelvedBooks(reader.id, key || undefined);
  return NextResponse.json(key ? { entry: shelves[0] ?? null } : {
    shelves, total: shelves.length, totalShelved: shelves.length,
  }, { headers });
}

export async function POST(req: NextRequest) {
  const reader = await sessionReader(req);
  if (!reader) return unauthorized();
  const parsed = mutation.safeParse(await req.json().catch(() => null));
  const changes = parsed.data;
  const key = changes?.workSlug || changes?.slug || changes?.workId;
  if (!changes || !key || (changes.status === undefined && changes.rating === undefined && changes.privateNote === undefined)) {
    return NextResponse.json({ error: "Supply a book and a valid shelf change." }, { status: 400, headers });
  }
  try {
    const result = await mutateShelfItem(reader.id, key, changes);
    if (!result) return NextResponse.json({ error: "Book not found." }, { status: 404, headers });
    return NextResponse.json(result, { headers });
  } catch {
    return NextResponse.json({ error: "Could not save your shelf change." }, { status: 500, headers });
  }
}
