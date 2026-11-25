import { and, desc, eq } from "drizzle-orm";
import { getDatabase, userBooks, works } from "@/lib/db";
import { ALL_500_BOOKS } from "./books-500";

type ShelfRow = typeof userBooks.$inferSelect;
const catalog = new Map(ALL_500_BOOKS.map(book => [book.slug, book]));
const isWorkId = (key: string) => /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(key);
const matchesWork = (key: string) => isWorkId(key) ? eq(works.id, key) : eq(works.slug, key);

function formatItem(row: ShelfRow, work: { slug: string; title: string }) {
  const book = catalog.get(work.slug);
  return {
    id: row.id, workId: row.workId, slug: work.slug, title: work.title,
    authorName: book?.authorName ?? "Unknown Author", coverUrl: book?.coverUrl ?? "/books/moby-dick.jpg",
    genreBadge: book?.genreBadge ?? "Classic", genreSlug: book?.genreSlug ?? "classics",
    status: row.status, rating: row.rating, privateNote: row.privateNote ?? undefined,
    addedAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
  };
}

export type ShelvedBookItem = ReturnType<typeof formatItem>;

export async function getAllShelvedBooks(userId: string, key?: string) {
  const db = await getDatabase();
  const rows = await db.select({ entry: userBooks, slug: works.slug, title: works.title })
    .from(userBooks).innerJoin(works, eq(userBooks.workId, works.id))
    .where(and(eq(userBooks.userId, userId), key ? matchesWork(key) : undefined))
    .orderBy(desc(userBooks.updatedAt));
  return rows.map(row => formatItem(row.entry, row));
}

export async function mutateShelfItem(userId: string, key: string, changes: {
  status?: ShelfRow["status"] | "remove" | null; rating?: number | null; privateNote?: string | null;
}) {
  const db = await getDatabase();
  return db.transaction(async tx => {
    const [work] = await tx.select({ id: works.id, slug: works.slug, title: works.title })
      .from(works).where(matchesWork(key));
    if (!work) return null;
    const removed = changes.status === "remove" || changes.status === null;
    let item: ShelvedBookItem | null = null;
    if (removed) {
      await tx.delete(userBooks).where(and(eq(userBooks.userId, userId), eq(userBooks.workId, work.id)));
    } else {
      const status = changes.status as ShelfRow["status"] | undefined;
      const { rating, privateNote } = changes;
      const [row] = await tx.insert(userBooks).values({
        userId, workId: work.id, status: status ?? "want_to_read", rating, privateNote,
      }).onConflictDoUpdate({
        target: [userBooks.userId, userBooks.workId],
        set: { status, rating, privateNote, updatedAt: new Date() },
      }).returning();
      item = formatItem(row, work);
    }
    const totalShelved = await tx.$count(userBooks, eq(userBooks.userId, userId));
    return { success: true, item, removed, totalShelved };
  });
}
