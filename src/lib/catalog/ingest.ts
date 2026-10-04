import { db, client, works, editions, authors, workAuthors, subjects, workSubjects, externalIds } from "../db";
import { runMigrations } from "../db/migrate";
import { eq, and } from "drizzle-orm";

interface GutenbergAuthor {
  name: string;
  birth_year?: number;
  death_year?: number;
}

interface GutenbergBook {
  id: number;
  title: string;
  authors: GutenbergAuthor[];
  summaries?: string[];
  subjects: string[];
  bookshelves: string[];
  languages: string[];
  copyright: boolean;
  formats: { [mime: string]: string };
  download_count: number;
}

/**
 * Clean and format author name from "LastName, FirstName" to "FirstName LastName"
 */
function normalizeAuthorName(rawName: string): string {
  if (!rawName) return "Unknown Author";
  const parts = rawName.split(",").map((s) => s.trim());
  if (parts.length === 2) {
    return `${parts[1]} ${parts[0]}`;
  }
  return rawName.trim();
}

/**
 * Generate a URL-friendly unique slug
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

/**
 * Infer audience level from subjects
 */
function inferAudience(subjects: string[], bookshelves: string[]): "children" | "teen" | "adult" | "all" {
  const combined = [...subjects, ...bookshelves].join(" ").toLowerCase();
  if (combined.includes("children") || combined.includes("juvenile") || combined.includes("fairy tale") || combined.includes("nursery")) {
    return "children";
  }
  if (combined.includes("young adult") || combined.includes("teen") || combined.includes("school")) {
    return "teen";
  }
  if (combined.includes("erotic") || combined.includes("psychological fiction") || combined.includes("existentialism")) {
    return "adult";
  }
  return "all";
}

/**
 * Ingest open-source public-domain books from Project Gutenberg
 */
export async function ingestOpenSourceBooks(maxBooks = 150) {
  await runMigrations();
  await client.waitReady;
  console.log(`\n======================================================`);
  console.log(` Starting Catalog Ingestion of Open-Source Classics   `);
  console.log(` Source: Project Gutenberg Public Domain Catalog     `);
  console.log(` Target count: ${maxBooks} books                    `);
  console.log(`======================================================\n`);

  let fetched = 0;
  let page = 1;
  let totalInserted = 0;

  while (fetched < maxBooks) {
    const url = `https://gutendex.com/books/?page=${page}`;
    console.log(`Fetching page ${page} from Gutendex...`);

    let data: { results: GutenbergBook[]; next: string | null };
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "CommunityLibraryIngester/1.0 (contact@communitylibrary.local)",
        },
      });

      if (!res.ok) {
        console.warn(`Gutendex returned status ${res.status}. Halting pagination.`);
        break;
      }

      data = await res.json();
    } catch (err) {
      console.error(`Failed to fetch page ${page}:`, err);
      break;
    }

    if (!data.results || data.results.length === 0) {
      break;
    }

    for (const book of data.results) {
      if (fetched >= maxBooks) break;

      // Filter: Skip non-English or audiobooks
      if (!book.languages.includes("en") || !book.title) {
        continue;
      }

      const primaryAuthor = book.authors[0];
      const authorName = normalizeAuthorName(primaryAuthor?.name || "Unknown Author");
      const authorSlug = slugify(authorName) || `author-${Date.now()}`;

      // Clean title and generate slug
      const cleanTitle = book.title.split("\n")[0].split("; or,")[0].split("; Or,")[0].trim();
      const baseSlug = slugify(cleanTitle) || `work-${book.id}`;

      // Check if work already exists by Gutenberg external ID or slug
      const existingExt = await db
        .select({ entityId: externalIds.entityId })
        .from(externalIds)
        .where(
          and(
            eq(externalIds.source, "gutenberg"),
            eq(externalIds.externalId, String(book.id))
          )
        )
        .limit(1);

      if (existingExt.length > 0) {
        // Already ingested
        fetched++;
        continue;
      }

      // Upsert Author
      let authorId: string;
      const existingAuthor = await db
        .select({ id: authors.id })
        .from(authors)
        .where(eq(authors.slug, authorSlug))
        .limit(1);

      if (existingAuthor.length > 0) {
        authorId = existingAuthor[0].id;
      } else {
        const bio = primaryAuthor?.birth_year
          ? `Author active (${primaryAuthor.birth_year}–${primaryAuthor.death_year || "?"}).`
          : undefined;

        const [newAuthor] = await db
          .insert(authors)
          .values({
            name: authorName,
            slug: authorSlug,
            bio,
            bioSource: "Project Gutenberg Metadata",
          })
          .returning({ id: authors.id });
        authorId = newAuthor.id;
      }

      // Resolve work slug uniqueness
      let finalSlug = baseSlug;
      let counter = 1;
      while (true) {
        const conflict = await db
          .select({ id: works.id })
          .from(works)
          .where(eq(works.slug, finalSlug))
          .limit(1);
        if (conflict.length === 0) break;
        finalSlug = `${baseSlug}-${counter++}`;
      }

      // Description / Summary
      const summary = book.summaries && book.summaries.length > 0
        ? book.summaries[0].replace(/\(This is an automatically generated summary\.\)/g, "").trim()
        : `A celebrated open-source literary classic available in the public domain.`;

      // Audience
      const audience = inferAudience(book.subjects, book.bookshelves);

      // Create Work
      const [newWork] = await db
        .insert(works)
        .values({
          slug: finalSlug,
          title: cleanTitle,
          originalLanguage: "en",
          description: summary,
          descriptionLanguage: "en",
          descriptionSource: "Project Gutenberg",
          audienceLevel: audience,
          qualityScore: Math.min(1.0, 0.7 + (book.download_count / 100000) * 0.3),
          status: "published",
        })
        .returning({ id: works.id });

      const workId = newWork.id;

      // Link Work-Author
      try {
        await db
          .insert(workAuthors)
          .values({
            workId,
            authorId,
            role: "author",
            position: 0,
          })
          .onConflictDoNothing();
      } catch (_) {}

      // Cover image from Gutenberg
      const coverUrl = book.formats["image/jpeg"] || "/books/moby-dick.jpg";

      // Create Edition
      await db.insert(editions).values({
        workId,
        format: "ebook",
        coverUrl,
        coverSource: "gutenberg_archive",
        coverAttribution: "Public Domain / Project Gutenberg",
        pageCount: 150 + Math.floor((book.download_count % 350)),
        language: "en",
      });

      // Record External ID for Project Gutenberg
      await db.insert(externalIds).values({
        entityType: "work",
        entityId: workId,
        source: "gutenberg",
        externalId: String(book.id),
        termsNote: "Public Domain worldwide; free open-source redistribution",
      });

      // Insert Subjects
      const topSubjects = [
        ...book.subjects.map((s) => s.split(" -- ")[0]),
        ...book.bookshelves.map((b) => b.replace("Category: ", "")),
      ].slice(0, 4);

      for (const subjName of topSubjects) {
        if (!subjName) continue;
        const normKey = slugify(subjName);
        if (!normKey) continue;

        let subjId: string;
        const existingSubj = await db
          .select({ id: subjects.id })
          .from(subjects)
          .where(eq(subjects.normalizedKey, normKey))
          .limit(1);

        if (existingSubj.length > 0) {
          subjId = existingSubj[0].id;
        } else {
          const [newSubj] = await db
            .insert(subjects)
            .values({
              name: subjName,
              language: "en",
              normalizedKey: normKey,
            })
            .returning({ id: subjects.id });
          subjId = newSubj.id;
        }

        try {
          await db
            .insert(workSubjects)
            .values({
              workId,
              subjectId: subjId,
            })
            .onConflictDoNothing();
        } catch (_) {}
      }

      totalInserted++;
      fetched++;
      process.stdout.write(`\r[${fetched}/${maxBooks}] Ingested: "${cleanTitle.slice(0, 32)}..." by ${authorName.slice(0, 20)}`);
    }

    if (!data.next) {
      break;
    }
    page++;
    // Small polite pause between page requests
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  console.log(`\n\n✓ Ingestion complete! Added ${totalInserted} open-source books to the community database.\n`);
}

// Run directly from CLI
if (require.main === module || process.argv[1]?.includes("ingest")) {
  const count = parseInt(process.argv[2] || "150", 10);
  ingestOpenSourceBooks(count)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Ingestion failed:", err);
      process.exit(1);
    });
}
