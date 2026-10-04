import { ALL_500_BOOKS, CatalogBook } from "./books-500";
import { getSimilarBooks, SimilarBookMatch } from "@/lib/recommend/engine";

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
  genre: string;
  genreBadge: string;
  genreSlug: string;
  relevanceScore?: number;
}

export interface SearchFilters {
  query?: string;
  audienceLevel?: string;
  subject?: string;
  sortBy?: "relevance" | "year_desc" | "year_asc" | "title";
  limit?: number;
  offset?: number;
}

function stripArticles(title: string): string {
  return title.toLowerCase().replace(/^(the|a|an)\s+/, "").trim();
}

function cleanString(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim();
}

export async function searchCatalog(filters: SearchFilters): Promise<{
  books: SearchResultBook[];
  total: number;
  recommendations: SimilarBookMatch[];
}> {
  const {
    query = "",
    audienceLevel,
    subject,
    sortBy = "relevance",
    limit = 24,
    offset = 0,
  } = filters;

  const rawQuery = query.trim().toLowerCase();
  const cleanQ = cleanString(rawQuery);
  const isSingleLetter = rawQuery.length === 1 && /[a-z0-9]/.test(rawQuery);

  let candidates: { book: CatalogBook; score: number }[] = [];

  for (const b of ALL_500_BOOKS) {
    // 1. Audience Filter
    if (audienceLevel && audienceLevel !== "all") {
      if (b.audienceLevel !== audienceLevel && b.audienceLevel !== "all") {
        continue;
      }
    }

    // 2. Subject / Genre Filter
    if (subject && subject !== "all" && subject !== "All Subjects") {
      const targetSubj = subject.toLowerCase().trim();
      const hasSubject =
        b.genre.toLowerCase().includes(targetSubj) ||
        b.genreBadge.toLowerCase().includes(targetSubj) ||
        b.subjects.some((s) => s.toLowerCase().includes(targetSubj));

      if (!hasSubject) {
        continue;
      }
    }

    // 3. Search Matching
    if (!rawQuery) {
      // Empty query: default library order
      candidates.push({ book: b, score: 10 });
      continue;
    }

    const titleLower = b.title.toLowerCase();
    const titleClean = cleanString(b.title);
    const strippedTitle = stripArticles(titleLower);
    const titleWords = titleClean.split(/\s+/);
    const authorLower = b.authorName.toLowerCase();
    const authorClean = cleanString(b.authorName);

    if (isSingleLetter) {
      // A) SINGLE LETTER SEARCH:
      // Show books whose title starts with that letter (either raw or after 'The/A/An')
      const rawStarts = titleLower.startsWith(rawQuery);
      const strippedStarts = strippedTitle.startsWith(rawQuery);
      const wordStarts = titleWords.some((w) => w.startsWith(rawQuery));

      if (rawStarts || strippedStarts || wordStarts) {
        let letterScore = 0;
        if (rawStarts) letterScore = 100;
        else if (strippedStarts) letterScore = 80;
        else letterScore = 40;

        candidates.push({ book: b, score: letterScore });
      }
    } else {
      // B) NAME / TITLE SEARCH:
      // ONLY show books whose title or author directly matches what the user wrote!
      let titleScore = 0;

      // 1. Exact title match
      if (titleLower === rawQuery || titleClean === cleanQ) {
        titleScore = 1000;
      }
      // 2. Title starts with query
      else if (titleLower.startsWith(rawQuery) || strippedTitle.startsWith(rawQuery)) {
        titleScore = 500;
      }
      // 3. Word in title starts with query
      else if (titleWords.some((w) => w.startsWith(cleanQ))) {
        titleScore = 300;
      }
      // 4. Title contains query as substring
      else if (titleClean.includes(cleanQ) || titleLower.includes(rawQuery)) {
        titleScore = 200;
      }
      // 5. Author name contains query (e.g. user typed author's name)
      else if (authorLower.includes(rawQuery) || authorClean.includes(cleanQ)) {
        titleScore = 150;
      }
      // 6. Multi-word title matching (e.g. user typed "hound baskerville")
      else {
        const queryTokens = cleanQ.split(/\s+/).filter((t) => t.length > 1);
        if (queryTokens.length > 1) {
          const allTokensInTitle = queryTokens.every(
            (t) => titleClean.includes(t) || authorClean.includes(t)
          );
          if (allTokensInTitle) {
            titleScore = 180;
          }
        }
      }

      // ONLY include books that matched the title/author!
      if (titleScore > 0) {
        candidates.push({ book: b, score: titleScore });
      }
    }
  }

  // Sorting
  if (sortBy === "year_desc") {
    candidates.sort((a, b) => (b.book.year || 0) - (a.book.year || 0));
  } else if (sortBy === "year_asc") {
    candidates.sort((a, b) => (a.book.year || 0) - (b.book.year || 0));
  } else if (sortBy === "title") {
    candidates.sort((a, b) => stripArticles(a.book.title).localeCompare(stripArticles(b.book.title)));
  } else {
    // Relevance sort (higher score first, then alphabetically by title)
    candidates.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return stripArticles(a.book.title).localeCompare(stripArticles(b.book.title));
    });
  }

  const total = candidates.length;
  const paginated = candidates.slice(offset, offset + limit);

  const formattedBooks: SearchResultBook[] = paginated.map(({ book, score }) => ({
    id: book.slug,
    slug: book.slug,
    title: book.title,
    subtitle: book.subtitle || null,
    authorName: book.authorName,
    authorSlug: book.authorSlug,
    firstPublishYear: book.year,
    audienceLevel: book.audienceLevel,
    coverUrl: book.coverUrl,
    pageCount: book.pages,
    description: book.description,
    subjects: book.subjects,
    genre: book.genre,
    genreBadge: book.genreBadge,
    genreSlug: book.genreSlug,
    relevanceScore: score,
  }));

  // Generate recommendations:
  // When a book name is searched, recommend companion books based on the #1 match
  // Exclude books already shown in the search results
  let recommendations: SimilarBookMatch[] = [];

  if (formattedBooks.length > 0) {
    const topSlug = formattedBooks[0].slug;
    const directResultsSlugs = new Set(formattedBooks.map((fb) => fb.slug));
    recommendations = getSimilarBooks(topSlug, 6).filter(
      (r) => !directResultsSlugs.has(r.slug)
    );
  } else if (rawQuery) {
    // If no direct title match, provide curated recommendations
    recommendations = getSimilarBooks("the-hound-of-the-baskervilles", 6);
  }

  return {
    books: formattedBooks,
    total,
    recommendations,
  };
}
