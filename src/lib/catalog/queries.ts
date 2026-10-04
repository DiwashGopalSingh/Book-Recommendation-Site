import { db, client, works, editions, authors, workAuthors, subjects, workSubjects, curatedLists, curatedListItems } from "../db";
import { eq, asc, desc } from "drizzle-orm";

export interface BookDetail {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  authorName: string;
  authorSlug: string;
  firstPublishYear: number | null;
  audienceLevel: string;
  coverUrl: string;
  pageCount: number;
  description: string | null;
  curatorNote?: string;
  subjects: string[];
}

/**
 * Get curated list with works and editions
 */
export async function getCuratedListWithBooks(slug: string) {
  try {
    await client.waitReady;
    const list = await db
      .select()
      .from(curatedLists)
      .where(eq(curatedLists.slug, slug))
      .limit(1);

    if (list.length === 0) return null;

    const items = await db
      .select({
        position: curatedListItems.position,
        curatorNote: curatedListItems.note,
        workId: works.id,
        workSlug: works.slug,
        title: works.title,
        subtitle: works.subtitle,
        year: works.firstPublishYear,
        description: works.description,
        audienceLevel: works.audienceLevel,
        qualityScore: works.qualityScore,
      })
      .from(curatedListItems)
      .innerJoin(works, eq(curatedListItems.workId, works.id))
      .where(eq(curatedListItems.listId, list[0].id))
      .orderBy(asc(curatedListItems.position));

    const booksWithDetails: BookDetail[] = [];

    for (const item of items) {
      // Fetch Author
      const authorRes = await db
        .select({
          name: authors.name,
          slug: authors.slug,
        })
        .from(workAuthors)
        .innerJoin(authors, eq(workAuthors.authorId, authors.id))
        .where(eq(workAuthors.workId, item.workId))
        .limit(1);

      // Fetch Edition (cover & pages)
      const editionRes = await db
        .select({
          coverUrl: editions.coverUrl,
          pageCount: editions.pageCount,
        })
        .from(editions)
        .where(eq(editions.workId, item.workId))
        .limit(1);

      // Fetch Subjects
      const subjectRes = await db
        .select({ name: subjects.name })
        .from(workSubjects)
        .innerJoin(subjects, eq(workSubjects.subjectId, subjects.id))
        .where(eq(workSubjects.workId, item.workId));

      booksWithDetails.push({
        id: item.workId,
        slug: item.workSlug,
        title: item.title,
        subtitle: item.subtitle,
        authorName: authorRes[0]?.name || "Unknown Author",
        authorSlug: authorRes[0]?.slug || "unknown",
        firstPublishYear: item.year,
        audienceLevel: item.audienceLevel,
        coverUrl: editionRes[0]?.coverUrl || "/books/moby-dick.jpg",
        pageCount: editionRes[0]?.pageCount || 250,
        description: item.description,
        curatorNote: item.curatorNote || undefined,
        subjects: subjectRes.map((s) => s.name),
      });
    }

    return {
      list: list[0],
      books: booksWithDetails,
    };
  } catch (error) {
    console.error("Error fetching curated list:", error);
    return null;
  }
}

/**
 * Get individual book detail by slug
 */
export async function getBookBySlug(slug: string) {
  try {
    await client.waitReady;
    const workList = await db
      .select()
      .from(works)
      .where(eq(works.slug, slug))
      .limit(1);

    if (workList.length === 0) {
      const { ALL_500_BOOKS } = await import("./books-500");
      const fallback = ALL_500_BOOKS.find((b) => b.slug === slug);
      if (!fallback) return null;
      return {
        work: {
          id: fallback.slug,
          slug: fallback.slug,
          title: fallback.title,
          subtitle: fallback.subtitle || null,
          firstPublishYear: fallback.year,
          description: fallback.description,
          audienceLevel: fallback.audienceLevel,
        } as any,
        author: {
          name: fallback.authorName,
          slug: fallback.authorSlug,
          bio: fallback.authorBio,
        },
        editions: [
          {
            coverUrl: fallback.coverUrl,
            pageCount: fallback.pages,
            format: "Paperback",
          },
        ] as any,
        subjects: fallback.subjects,
      };
    }
    const work = workList[0];

    const authorRes = await db
      .select({
        name: authors.name,
        slug: authors.slug,
        bio: authors.bio,
      })
      .from(workAuthors)
      .innerJoin(authors, eq(workAuthors.authorId, authors.id))
      .where(eq(workAuthors.workId, work.id))
      .limit(1);

    const editionList = await db
      .select()
      .from(editions)
      .where(eq(editions.workId, work.id));

    const subjectRes = await db
      .select({ name: subjects.name })
      .from(workSubjects)
      .innerJoin(subjects, eq(workSubjects.subjectId, subjects.id))
      .where(eq(workSubjects.workId, work.id));

    return {
      work,
      author: authorRes[0] || null,
      editions: editionList,
      subjects: subjectRes.map((s) => s.name),
    };
  } catch (error) {
    console.warn("DB query failed, falling back to static catalog for slug:", slug);
    try {
      const { ALL_500_BOOKS } = await import("./books-500");
      const fallback = ALL_500_BOOKS.find((b) => b.slug === slug);
      if (fallback) {
        return {
          work: {
            id: fallback.slug,
            slug: fallback.slug,
            title: fallback.title,
            subtitle: fallback.subtitle || null,
            firstPublishYear: fallback.year,
            description: fallback.description,
            audienceLevel: fallback.audienceLevel,
          } as any,
          author: {
            name: fallback.authorName,
            slug: fallback.authorSlug,
            bio: fallback.authorBio,
          },
          editions: [
            {
              coverUrl: fallback.coverUrl,
              pageCount: fallback.pages,
              format: "Paperback",
            },
          ] as any,
          subjects: fallback.subjects,
        };
      }
    } catch (fallbackErr) {
      console.error("Static catalog fallback failed:", fallbackErr);
    }
    return null;
  }
}
