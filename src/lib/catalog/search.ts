import { db, client, works, editions, authors, workAuthors, subjects, workSubjects } from "../db";
import { eq, or, ilike, and, desc, asc, sql } from "drizzle-orm";

export interface SearchResultBook {
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
  subjects: string[];
}

export interface SearchFilters {
  query?: string;
  audienceLevel?: string;
  subject?: string;
  sortBy?: "relevance" | "year_desc" | "year_asc" | "title";
  limit?: number;
  offset?: number;
}

export async function searchCatalog(filters: SearchFilters): Promise<{
  books: SearchResultBook[];
  total: number;
}> {
  const {
    query = "",
    audienceLevel,
    subject,
    sortBy = "relevance",
    limit = 24,
    offset = 0,
  } = filters;

  const cleanQuery = query.trim().toLowerCase();

  try {
    await client.waitReady;
    // 1. Fetch works
    let queryConditions = [];

    if (cleanQuery) {
      queryConditions.push(
        or(
          ilike(works.title, `%${cleanQuery}%`),
          ilike(works.subtitle, `%${cleanQuery}%`),
          ilike(works.description, `%${cleanQuery}%`)
        )
      );
    }

    if (audienceLevel && audienceLevel !== "all") {
      queryConditions.push(eq(works.audienceLevel, audienceLevel as any));
    }

    // Base query for works
    let baseQuery = db
      .select({
        id: works.id,
        slug: works.slug,
        title: works.title,
        subtitle: works.subtitle,
        firstPublishYear: works.firstPublishYear,
        audienceLevel: works.audienceLevel,
        description: works.description,
      })
      .from(works);

    if (queryConditions.length > 0) {
      baseQuery = baseQuery.where(and(...queryConditions)) as any;
    }

    // Apply sorting
    if (sortBy === "year_desc") {
      baseQuery = baseQuery.orderBy(desc(works.firstPublishYear)) as any;
    } else if (sortBy === "year_asc") {
      baseQuery = baseQuery.orderBy(asc(works.firstPublishYear)) as any;
    } else if (sortBy === "title") {
      baseQuery = baseQuery.orderBy(asc(works.title)) as any;
    }

    const matchedWorks = await baseQuery;

    // 2. Fetch all authors and subjects to also match by author name or subject if query provided
    let allCandidates = [...matchedWorks];

    if (cleanQuery) {
      // Find works by author match
      const authorMatches = await db
        .select({
          workId: workAuthors.workId,
        })
        .from(workAuthors)
        .innerJoin(authors, eq(workAuthors.authorId, authors.id))
        .where(ilike(authors.name, `%${cleanQuery}%`));

      const authorWorkIds = new Set(authorMatches.map((m) => m.workId));

      // Find works by subject match
      const subjectMatches = await db
        .select({
          workId: workSubjects.workId,
        })
        .from(workSubjects)
        .innerJoin(subjects, eq(workSubjects.subjectId, subjects.id))
        .where(
          or(
            ilike(subjects.name, `%${cleanQuery}%`),
            ilike(subjects.normalizedKey, `%${cleanQuery}%`)
          )
        );

      const subjectWorkIds = new Set(subjectMatches.map((m) => m.workId));

      // Combine matches if not already in list
      const existingIds = new Set(allCandidates.map((w) => w.id));

      for (const wId of [...authorWorkIds, ...subjectWorkIds]) {
        if (!existingIds.has(wId)) {
          const extraWork = await db
            .select({
              id: works.id,
              slug: works.slug,
              title: works.title,
              subtitle: works.subtitle,
              firstPublishYear: works.firstPublishYear,
              audienceLevel: works.audienceLevel,
              description: works.description,
            })
            .from(works)
            .where(
              audienceLevel && audienceLevel !== "all"
                ? and(eq(works.id, wId), eq(works.audienceLevel, audienceLevel as any))
                : eq(works.id, wId)
            )
            .limit(1);

          if (extraWork.length > 0) {
            allCandidates.push(extraWork[0]);
            existingIds.add(wId);
          }
        }
      }
    }

    // 3. Hydrate with Author, Edition (Cover & Pages), and Subjects
    const results: SearchResultBook[] = [];

    for (const work of allCandidates) {
      // Fetch Author
      const authorRes = await db
        .select({
          name: authors.name,
          slug: authors.slug,
        })
        .from(workAuthors)
        .innerJoin(authors, eq(workAuthors.authorId, authors.id))
        .where(eq(workAuthors.workId, work.id))
        .limit(1);

      // Fetch Edition (cover & pageCount)
      const editionRes = await db
        .select({
          coverUrl: editions.coverUrl,
          pageCount: editions.pageCount,
        })
        .from(editions)
        .where(eq(editions.workId, work.id))
        .limit(1);

      // Fetch Subjects
      const subjectRes = await db
        .select({ name: subjects.name })
        .from(workSubjects)
        .innerJoin(subjects, eq(workSubjects.subjectId, subjects.id))
        .where(eq(workSubjects.workId, work.id));

      const workSubjectNames = subjectRes.map((s) => s.name);

      // Filter by subject if specified
      if (subject && subject !== "all" && subject !== "All Subjects") {
        const target = subject.toLowerCase().trim();
        const matchesSubject = workSubjectNames.some((s) => {
          const lower = s.toLowerCase();
          return lower.includes(target) || target.includes(lower);
        });
        if (!matchesSubject) continue;
      }

      results.push({
        id: work.id,
        slug: work.slug,
        title: work.title,
        subtitle: work.subtitle,
        authorName: authorRes[0]?.name || "Unknown Author",
        authorSlug: authorRes[0]?.slug || "unknown",
        firstPublishYear: work.firstPublishYear,
        audienceLevel: work.audienceLevel,
        coverUrl: editionRes[0]?.coverUrl || "/books/moby-dick.jpg",
        pageCount: editionRes[0]?.pageCount || 250,
        description: work.description,
        subjects: workSubjectNames,
      });
    }

    const total = results.length;
    const paginated = results.slice(offset, offset + limit);

    return {
      books: paginated,
      total,
    };
  } catch (error) {
    console.error("Search catalog error:", error);
    return { books: [], total: 0 };
  }
}
