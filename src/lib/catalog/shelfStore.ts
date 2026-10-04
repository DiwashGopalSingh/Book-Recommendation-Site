import fs from "fs";
import path from "path";
import { ALL_500_BOOKS } from "./books-500";
import { db, client, userBooks, users, works } from "@/lib/db";
import { eq, and } from "drizzle-orm";

export interface ShelvedBookItem {
  id: string;
  slug: string;
  workId?: string;
  title: string;
  authorName: string;
  coverUrl: string;
  genreBadge: string;
  genreSlug: string;
  status: "want_to_read" | "reading" | "read" | "did_not_finish";
  rating: number | null;
  privateNote?: string;
  addedAt: string;
  updatedAt: string;
}

const STORE_PATH = path.join(
  process.cwd(),
  "src",
  "lib",
  "catalog",
  "user-shelves-store.json"
);

// Initial default shelf seed
const DEFAULT_SHELF_SLUGS = [
  { slug: "the-hound-of-the-baskervilles", status: "want_to_read" as const, rating: 5 },
  { slug: "the-time-machine", status: "reading" as const, rating: 4 },
  { slug: "dracula", status: "read" as const, rating: 5 },
  { slug: "meditations", status: "read" as const, rating: 5 },
  { slug: "moby-dick", status: "want_to_read" as const, rating: null },
];

function getInitialStore(): Record<string, ShelvedBookItem> {
  const store: Record<string, ShelvedBookItem> = {};
  const now = new Date().toISOString();

  for (const item of DEFAULT_SHELF_SLUGS) {
    const book = ALL_500_BOOKS.find((b) => b.slug === item.slug);
    if (book) {
      store[item.slug] = {
        id: `shelf_${item.slug}`,
        slug: item.slug,
        title: book.title,
        authorName: book.authorName,
        coverUrl: book.coverUrl,
        genreBadge: book.genreBadge,
        genreSlug: book.genreSlug,
        status: item.status,
        rating: item.rating,
        addedAt: now,
        updatedAt: now,
      };
    }
  }

  return store;
}

function readLocalStore(): Record<string, ShelvedBookItem> {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn("Failed to read user shelves store, initializing default:", err);
  }

  const initial = getInitialStore();
  writeLocalStore(initial);
  return initial;
}

function writeLocalStore(store: Record<string, ShelvedBookItem>) {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write user shelves store:", err);
  }
}

/**
 * Get all shelved books
 */
export async function getAllShelvedBooks(): Promise<ShelvedBookItem[]> {
  const store = readLocalStore();
  return Object.values(store).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

/**
 * Get shelf status for a single book by slug
 */
export async function getShelfItem(slug: string): Promise<ShelvedBookItem | null> {
  const store = readLocalStore();
  return store[slug] || null;
}

/**
 * Add, update, or remove a book from the shelf
 */
export async function mutateShelfItem(params: {
  slug: string;
  status: string | null;
  rating?: number | null;
  privateNote?: string;
}): Promise<{
  success: boolean;
  item: ShelvedBookItem | null;
  removed: boolean;
  totalShelved: number;
}> {
  const { slug, status, rating, privateNote } = params;
  const store = readLocalStore();
  const now = new Date().toISOString();

  // If status is "remove" or null -> Remove from shelf
  if (!status || status === "remove") {
    const existed = Boolean(store[slug]);
    if (existed) {
      delete store[slug];
      writeLocalStore(store);
    }
    return {
      success: true,
      item: null,
      removed: true,
      totalShelved: Object.keys(store).length,
    };
  }

  // Validate status
  const validStatus = [
    "want_to_read",
    "reading",
    "read",
    "did_not_finish",
  ].includes(status)
    ? (status as ShelvedBookItem["status"])
    : "want_to_read";

  const existing = store[slug];
  const bookMeta = ALL_500_BOOKS.find((b) => b.slug === slug);

  const updatedItem: ShelvedBookItem = {
    id: existing?.id || `shelf_${slug}_${Date.now()}`,
    slug,
    title: bookMeta?.title || existing?.title || slug,
    authorName: bookMeta?.authorName || existing?.authorName || "Unknown Author",
    coverUrl: bookMeta?.coverUrl || existing?.coverUrl || "/books/moby-dick.jpg",
    genreBadge: bookMeta?.genreBadge || existing?.genreBadge || "Classic",
    genreSlug: bookMeta?.genreSlug || existing?.genreSlug || "classics",
    status: validStatus,
    rating: rating !== undefined ? rating : existing ? existing.rating : null,
    privateNote: privateNote !== undefined ? privateNote : existing?.privateNote,
    addedAt: existing ? existing.addedAt : now,
    updatedAt: now,
  };

  store[slug] = updatedItem;
  writeLocalStore(store);

  // Optional background sync with DB if PGlite is available
  try {
    await client.waitReady;
    // ensure community reader user exists
    let guestUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.displayName, "Community Reader"))
      .limit(1);

    if (guestUser.length > 0) {
      const workRecord = await db
        .select({ id: works.id })
        .from(works)
        .where(eq(works.slug, slug))
        .limit(1);

      if (workRecord.length > 0) {
        const uId = guestUser[0].id;
        const wId = workRecord[0].id;
        const existingDB = await db
          .select({ id: userBooks.id })
          .from(userBooks)
          .where(and(eq(userBooks.userId, uId), eq(userBooks.workId, wId)))
          .limit(1);

        if (existingDB.length > 0) {
          await db
            .update(userBooks)
            .set({
              status: validStatus,
              rating: updatedItem.rating,
              updatedAt: new Date(),
            })
            .where(eq(userBooks.id, existingDB[0].id));
        } else {
          await db.insert(userBooks).values({
            userId: uId,
            workId: wId,
            status: validStatus,
            rating: updatedItem.rating,
          });
        }
      }
    }
  } catch (dbErr) {
    // Non-blocking: local store has already persisted
  }

  return {
    success: true,
    item: updatedItem,
    removed: false,
    totalShelved: Object.keys(store).length,
  };
}
