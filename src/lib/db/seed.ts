import {
  db,
  client,
  works,
  editions,
  authors,
  workAuthors,
  subjects,
  workSubjects,
  curatedLists,
  curatedListItems,
  externalIds,
} from "./index";
import { runMigrations } from "./migrate";
import { eq } from "drizzle-orm";
import { ALL_500_BOOKS, CATALOG_GENRES, CatalogBook } from "../catalog/books-500";

function slugifyKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function runSeed() {
  await client.waitReady;
  console.log("\n=======================================================");
  console.log(" Seeding 500 Authentic Books across 10 Distinct Genres ");
  console.log("=======================================================\n");

  // 1. Create / Upsert Curated Lists for all 10 genres
  const listIdMap = new Map<string, string>();
  for (const genre of CATALOG_GENRES) {
    const existing = await db
      .select({ id: curatedLists.id })
      .from(curatedLists)
      .where(eq(curatedLists.slug, genre.slug))
      .limit(1);

    if (existing.length > 0) {
      listIdMap.set(genre.slug, existing[0].id);
    } else {
      const [inserted] = await db
        .insert(curatedLists)
        .values({
          slug: genre.slug,
          title: genre.name,
          description: genre.subtitle,
          audienceLevel: "all",
          language: "en",
          status: "published",
        })
        .returning({ id: curatedLists.id });
      listIdMap.set(genre.slug, inserted.id);
    }
  }
  console.log(`✓ Ensured ${CATALOG_GENRES.length} curated genre shelves exist in database.`);

  // 2. Cache / Upsert Authors in Bulk
  const authorMap = new Map<string, string>();
  const existingAuthors = await db.select({ id: authors.id, slug: authors.slug }).from(authors);
  for (const a of existingAuthors) {
    authorMap.set(a.slug, a.id);
  }

  // Find unique authors in the 500 books
  const uniqueAuthors = new Map<string, { name: string; slug: string; bio: string }>();
  for (const b of ALL_500_BOOKS) {
    if (!authorMap.has(b.authorSlug) && !uniqueAuthors.has(b.authorSlug)) {
      uniqueAuthors.set(b.authorSlug, {
        name: b.authorName,
        slug: b.authorSlug,
        bio: b.authorBio,
      });
    }
  }

  for (const [slug, data] of uniqueAuthors.entries()) {
    const [inserted] = await db
      .insert(authors)
      .values({
        name: data.name,
        slug: data.slug,
        bio: data.bio,
        bioSource: "Community Literary Encyclopedia",
      })
      .returning({ id: authors.id });
    authorMap.set(slug, inserted.id);
  }
  console.log(`✓ Ensured ${authorMap.size} authors loaded in memory.`);

  // 3. Cache / Upsert Subjects in Bulk
  const subjectMap = new Map<string, string>();
  const existingSubjs = await db.select({ id: subjects.id, key: subjects.normalizedKey }).from(subjects);
  for (const s of existingSubjs) {
    subjectMap.set(s.key, s.id);
  }

  const allSubjectNames = new Set<string>();
  for (const b of ALL_500_BOOKS) {
    for (const s of b.subjects) {
      allSubjectNames.add(s);
    }
    allSubjectNames.add(b.genre);
  }

  for (const sName of allSubjectNames) {
    const key = slugifyKey(sName);
    if (!key) continue;
    if (!subjectMap.has(key)) {
      const [inserted] = await db
        .insert(subjects)
        .values({
          name: sName,
          language: "en",
          normalizedKey: key,
        })
        .returning({ id: subjects.id });
      subjectMap.set(key, inserted.id);
    }
  }
  console.log(`✓ Ensured ${subjectMap.size} subjects/genres cached.`);

  // 4. Cache existing works to prevent duplicates
  const existingWorks = await db.select({ id: works.id, slug: works.slug }).from(works);
  const workMap = new Map<string, string>();
  for (const w of existingWorks) {
    workMap.set(w.slug, w.id);
  }

  // 5. Insert Books, Editions, Links, and Curated Items
  let seededCount = 0;
  let genrePositionMap = new Map<string, number>();

  for (const book of ALL_500_BOOKS) {
    let workId = workMap.get(book.slug);

    if (!workId) {
      const [newWork] = await db
        .insert(works)
        .values({
          slug: book.slug,
          title: book.title,
          subtitle: book.subtitle,
          originalLanguage: book.language,
          firstPublishYear: book.year,
          description: book.description,
          audienceLevel: book.audienceLevel,
          qualityScore: 1.0,
          status: "published",
        })
        .returning({ id: works.id });
      workId = newWork.id;
      workMap.set(book.slug, workId);

      // Work-Author junction
      const authorId = authorMap.get(book.authorSlug);
      if (authorId) {
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
      }

      // Work-Subjects junctions
      for (const sName of [...book.subjects, book.genre]) {
        const key = slugifyKey(sName);
        const subjId = subjectMap.get(key);
        if (subjId) {
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
      }

      // Edition (Cover & Pages)
      await db.insert(editions).values({
        workId,
        pageCount: book.pages,
        format: "paperback",
        coverUrl: book.coverUrl,
        coverSource: "openlibrary_archive",
        coverAttribution: "Public Domain / Open Library",
        language: "en",
      });

      // External IDs
      if (book.gutenbergId) {
        try {
          await db
            .insert(externalIds)
            .values({
              entityType: "work",
              entityId: workId,
              source: "gutenberg",
              externalId: book.gutenbergId,
              termsNote: "Public Domain worldwide; free redistribution under Gutenberg License",
            })
            .onConflictDoNothing();
        } catch (_) {}
      }

      if (book.openLibraryWorkId) {
        try {
          await db
            .insert(externalIds)
            .values({
              entityType: "work",
              entityId: workId,
              source: "openlibrary",
              externalId: book.openLibraryWorkId,
              termsNote: "CC0 / Open Library Metadata",
            })
            .onConflictDoNothing();
        } catch (_) {}
      }

      seededCount++;
    }

    // Attach to curated list corresponding to its genre
    const targetListId = listIdMap.get(book.genreSlug);
    if (targetListId) {
      const currentPos = genrePositionMap.get(book.genreSlug) || 0;
      genrePositionMap.set(book.genreSlug, currentPos + 1);

      try {
        await db
          .insert(curatedListItems)
          .values({
            listId: targetListId,
            workId,
            position: currentPos,
            note: book.curatorNote,
          });
      } catch (_) {}
    }
  }

  const totalWorksInDb = (await db.select({ id: works.id }).from(works)).length;
  console.log(`\n✓ Seed completed! Inserted ${seededCount} new works.`);
  console.log(`✓ Total works in database: ${totalWorksInDb}`);
  console.log(`✓ All works arranged into their 10 respective genre curated shelves!`);
}

// Run if called directly
if (require.main === module || process.argv[1]?.includes("seed")) {
  (async () => {
    await runMigrations();
    await runSeed();
    console.log("\nDatabase initialized and seeded with 500 books successfully!");
    process.exit(0);
  })().catch((err) => {
    console.error("Seed error:", err);
    process.exit(1);
  });
}
