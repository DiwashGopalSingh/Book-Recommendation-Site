import { ALL_500_BOOKS, CATALOG_GENRES, type CatalogBook } from "./books-500";
import { getDatabase } from "../db";

export type DiscoveryBook = Pick<CatalogBook, "slug" | "title" | "subtitle" | "authorName" | "authorSlug" |
  "coverUrl" | "subjects" | "description" | "curatorNote" | "genre" | "genreBadge" | "genreSlug"> & {
  year: number | null;
  pages: number | null;
  audienceLevel: string;
};

const builtInSlugs = ALL_500_BOOKS.map(book => book.slug);

export async function getDiscoveryBooks(): Promise<DiscoveryBook[]> {
  const db = await getDatabase();
  const imported = await db.query.works.findMany({
    where: (work, { and, eq, notInArray }) => and(eq(work.status, "published"), notInArray(work.slug, builtInSlugs)),
    orderBy: (work, { asc }) => asc(work.slug),
    with: {
      workAuthors: {
        where: (link, { eq }) => eq(link.role, "author"),
        orderBy: (link, { asc }) => [asc(link.position), asc(link.authorId)],
        limit: 1, with: { author: true },
      },
      editions: { orderBy: (edition, { asc }) => [asc(edition.createdAt), asc(edition.id)], limit: 1 },
      workSubjects: { with: { subject: true } },
    },
  });

  return [...ALL_500_BOOKS, ...imported.map(work => {
    const author = work.workAuthors[0]?.author;
    const edition = work.editions[0];
    const subjects = work.workSubjects.map(link => link.subject.name).sort();
    const labels = new Set(subjects.map(name => name.toLowerCase()));
    const genre = CATALOG_GENRES.find(g => [g.slug, g.name, g.badge].some(label => labels.has(label.toLowerCase())));
    return {
      slug: work.slug, title: work.title, subtitle: work.subtitle ?? undefined,
      authorName: author?.name ?? "Unknown Author", authorSlug: author?.slug ?? "",
      year: work.firstPublishYear, pages: edition?.pageCount ?? null, audienceLevel: work.audienceLevel,
      coverUrl: edition?.coverUrl ?? "/books/moby-dick.jpg", subjects,
      description: work.description ?? "", curatorNote: "",
      genre: genre?.name ?? subjects[0] ?? "", genreBadge: genre?.badge ?? subjects[0] ?? "Unclassified",
      genreSlug: genre?.slug ?? "",
    };
  })];
}
