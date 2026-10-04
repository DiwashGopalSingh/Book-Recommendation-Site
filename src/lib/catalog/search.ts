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
  const queryTokens = cleanString(rawQuery)
    .split(/\s+/)
    .filter((t) => t.length > 1);

  // Filter and score books from the complete 500 catalog
  let candidates: { book: CatalogBook; score: number }[] = [];

  for (const b of ALL_500_BOOKS) {
    // 1. Audience Filter
    if (audienceLevel && audienceLevel !== "all") {
      if (b.audienceLevel !== audienceLevel && b.audienceLevel !== "all") {
        continue;
      }
    }

    // 2. Subject Filter
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

    // 3. Relevance Scoring
    let score = 0;

    if (!rawQuery) {
      // If no query, base score by publication year / default order
      score = 10;
    } else {
      const titleLower = b.title.toLowerCase();
      const titleClean = cleanString(b.title);
      const authorLower = b.authorName.toLowerCase();
      const descLower = (b.description || "").toLowerCase();
      const genreLower = b.genre.toLowerCase();
      const subjectsStr = b.subjects.join(" ").toLowerCase();

      // Exact title match
      if (titleLower === rawQuery) {
        score += 200;
      } else if (titleLower.startsWith(rawQuery)) {
        score += 120;
      } else if (titleLower.includes(rawQuery)) {
        score += 80;
      }

      // Exact author match
      if (authorLower === rawQuery) {
        score += 150;
      } else if (authorLower.includes(rawQuery)) {
        score += 70;
      }

      // Genre & subjects match
      if (genreLower.includes(rawQuery) || b.genreBadge.toLowerCase().includes(rawQuery)) {
        score += 60;
      }
      if (subjectsStr.includes(rawQuery)) {
        score += 50;
      }

      // Description match
      if (descLower.includes(rawQuery)) {
        score += 25;
      }

      // Token-level matching (partial words, multi-word queries)
      if (queryTokens.length > 0) {
        let tokenMatches = 0;
        for (const token of queryTokens) {
          if (titleClean.includes(token)) {
            score += 40;
            tokenMatches++;
          } else if (cleanString(authorLower).includes(token)) {
            score += 35;
            tokenMatches++;
          } else if (cleanString(genreLower).includes(token)) {
            score += 25;
            tokenMatches++;
          } else if (cleanString(subjectsStr).includes(token)) {
            score += 20;
            tokenMatches++;
          } else if (cleanString(descLower).includes(token)) {
            score += 10;
            tokenMatches++;
          }
        }

        // Bonus if all query tokens were matched
        if (tokenMatches >= queryTokens.length) {
          score += 50;
        }
      }
    }

    if (!rawQuery || score > 0) {
      candidates.push({ book: b, score });
    }
  }

  // Sorting
  if (sortBy === "year_desc") {
    candidates.sort((a, b) => (b.book.year || 0) - (a.book.year || 0));
  } else if (sortBy === "year_asc") {
    candidates.sort((a, b) => (a.book.year || 0) - (b.book.year || 0));
  } else if (sortBy === "title") {
    candidates.sort((a, b) => a.book.title.localeCompare(b.book.title));
  } else {
    // Relevance sort
    candidates.sort((a, b) => b.score - a.score);
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

  // Generate smart recommendations based on the search context
  let recommendations: SimilarBookMatch[] = [];

  if (formattedBooks.length > 0) {
    // Recommend books similar to the #1 top matching book
    const topSlug = formattedBooks[0].slug;
    recommendations = getSimilarBooks(topSlug, 6).filter(
      (r) => !formattedBooks.some((fb) => fb.slug === r.slug)
    );
  } else {
    // If 0 search results, recommend curated classics from the recommender engine
    recommendations = getSimilarBooks("the-hound-of-the-baskervilles", 6);
  }

  return {
    books: formattedBooks,
    total,
    recommendations,
  };
}
