import similaritiesData from "@/lib/catalog/book-similarities.json";
import { ALL_500_BOOKS as ALL_CATALOG_BOOKS, CatalogBook } from "@/lib/catalog/books-500";

export interface SimilarBookMatch {
  slug: string;
  title: string;
  authorName: string;
  authorSlug: string;
  year: number;
  coverUrl: string;
  genreBadge: string;
  genreSlug: string;
  audienceLevel: string;
  score: number;
  matchPercentage: number;
  reason: string;
  sharedSubjects: string[];
}

export interface RecommendationResponse {
  isColdStart: boolean;
  explanationNote: string;
  recommendations: (SimilarBookMatch & { sourceShelvedTitle?: string })[];
}

const typedSimilarities: Record<string, SimilarBookMatch[]> = similaritiesData as any;

/**
 * 1. Get Content-Based "Similar Books" for a given book slug.
 * Instant O(1) lookup from the precomputed TF-IDF + Subject affinity graph.
 */
export function getSimilarBooks(slug: string, limit = 8): SimilarBookMatch[] {
  if (typedSimilarities[slug] && typedSimilarities[slug].length > 0) {
    return typedSimilarities[slug].slice(0, limit);
  }

  // Fallback: on-the-fly subject matching if slug wasn't in static map
  const target = ALL_CATALOG_BOOKS.find((b) => b.slug === slug);
  if (!target) return [];

  const targetSubjects = new Set(target.subjects.map((s) => s.toLowerCase()));

  const scored = ALL_CATALOG_BOOKS
    .filter((b) => b.slug !== slug)
    .map((candidate) => {
      const shared = candidate.subjects.filter((s) => targetSubjects.has(s.toLowerCase()));
      const authorMatch = candidate.authorSlug === target.authorSlug ? 1 : 0;
      const genreMatch = candidate.genreSlug === target.genreSlug ? 1 : 0;
      const score = (shared.length * 2 + genreMatch * 2 + authorMatch * 3) / 10;
      
      let reason = `Shared genre in ${candidate.genreBadge}`;
      if (authorMatch) reason = `Same author (${candidate.authorName})`;
      else if (shared.length > 0) reason = `Shared themes: ${shared.slice(0, 2).join(', ')}`;

      return {
        slug: candidate.slug,
        title: candidate.title,
        authorName: candidate.authorName,
        authorSlug: candidate.authorSlug,
        year: candidate.year,
        coverUrl: candidate.coverUrl,
        genreBadge: candidate.genreBadge,
        genreSlug: candidate.genreSlug,
        audienceLevel: candidate.audienceLevel,
        score: Math.min(1, score),
        matchPercentage: Math.min(99, Math.max(50, Math.round(score * 100 + 40))),
        reason,
        sharedSubjects: shared,
      };
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}

/**
 * 2. Get Personalized Recommendations based on a user's shelved/rated books.
 * Transparent explanation generated for every recommendation.
 */
export interface UserPreferencesInput {
  genres?: string[];
  interests?: string[];
  readingGoal?: string;
}

/**
 * 2. Get Personalized Recommendations based on a user's shelved/rated books and explicit preferences.
 * Transparent explanation generated for every recommendation.
 */
export function getPersonalizedRecommendations(
  shelvedSlugs: string[] = [],
  limit = 8,
  preferences?: UserPreferencesInput
): RecommendationResponse {
  const hasShelved = Array.isArray(shelvedSlugs) && shelvedSlugs.length > 0;
  const hasPreferences = Boolean(
    preferences &&
      ((preferences.genres && preferences.genres.length > 0) ||
        (preferences.interests && preferences.interests.length > 0))
  );

  // If neither shelved books nor preferences are present, return curated cold-start landmark picks
  if (!hasShelved && !hasPreferences) {
    const coldStartSlugs = [
      "the-hound-of-the-baskervilles",
      "the-time-machine",
      "meditations",
      "moby-dick",
      "dracula",
      "pride-and-prejudice",
      "the-republic",
      "the-picture-of-dorian-gray"
    ];

    const coldStartBooks: SimilarBookMatch[] = coldStartSlugs
      .map((slug) => ALL_CATALOG_BOOKS.find((b) => b.slug === slug))
      .filter((b): b is CatalogBook => Boolean(b))
      .map((b) => ({
        slug: b.slug,
        title: b.title,
        authorName: b.authorName,
        authorSlug: b.authorSlug,
        year: b.year,
        coverUrl: b.coverUrl,
        genreBadge: b.genreBadge,
        genreSlug: b.genreSlug,
        audienceLevel: b.audienceLevel,
        score: 0.9,
        matchPercentage: 92,
        reason: "Curated library classic to start your taste profile",
        sharedSubjects: b.subjects.slice(0, 2),
      }));

    return {
      isColdStart: true,
      explanationNote:
        "Curated starter landmarks across 10 genres. Complete your reading preferences or add books to your private shelf to unlock tailored recommendations.",
      recommendations: coldStartBooks.slice(0, limit),
    };
  }

  const shelvedSet = new Set(shelvedSlugs || []);
  const userBooks = ALL_CATALOG_BOOKS.filter((b) => shelvedSet.has(b.slug));

  // Build taste profile distributions
  const preferredGenres: Record<string, number> = {};
  const preferredSubjects: Record<string, number> = {};
  const preferredAuthors: Record<string, number> = {};
  const explicitGenres = new Set(preferences?.genres || []);
  const explicitInterests = (preferences?.interests || []).map((i) => i.toLowerCase().trim());

  // 1. Explicit preferences give high primary weighting
  for (const g of explicitGenres) {
    preferredGenres[g] = (preferredGenres[g] || 0) + 3.5;
  }

  // 2. Shelved books enrich the profile
  for (const b of userBooks) {
    preferredGenres[b.genreSlug] = (preferredGenres[b.genreSlug] || 0) + 1.2;
    preferredAuthors[b.authorSlug] = (preferredAuthors[b.authorSlug] || 0) + 2.0;
    for (const subj of b.subjects) {
      const sKey = subj.toLowerCase().trim();
      preferredSubjects[sKey] = (preferredSubjects[sKey] || 0) + 1.0;
    }
  }

  // Score candidate books that the user has NOT yet shelved
  const candidateScores: (SimilarBookMatch & { sourceShelvedTitle?: string })[] = [];

  for (const candidate of ALL_CATALOG_BOOKS) {
    if (shelvedSet.has(candidate.slug)) continue; // Filter out already shelved books

    let score = 0;
    let explicitInterestMatch: string | null = null;
    const matchingSubjects: string[] = [];

    // Explicit Genre affinity
    const isExplicitGenre = explicitGenres.has(candidate.genreSlug);
    if (isExplicitGenre) {
      score += 2.2;
    } else if (preferredGenres[candidate.genreSlug]) {
      score += 0.4 * preferredGenres[candidate.genreSlug];
    }

    // Explicit Interest keywords affinity (against title, subjects, curator note)
    const bookSearchText = [
      candidate.title,
      candidate.curatorNote,
      candidate.description,
      ...candidate.subjects,
    ].join(' ').toLowerCase();

    for (const rawInterest of explicitInterests) {
      const interestTokens = rawInterest
        .split(/[\s,&/-]+/)
        .filter((tok) => tok.length > 3 && !['with', 'that', 'from'].includes(tok));
      
      const tokenMatches = interestTokens.filter((tok) => bookSearchText.includes(tok));
      if (tokenMatches.length >= 1) {
        score += 1.4 * (tokenMatches.length / interestTokens.length);
        if (!explicitInterestMatch) {
          explicitInterestMatch = rawInterest;
        }
      }
    }

    // Author affinity
    if (preferredAuthors[candidate.authorSlug]) {
      score += 0.5 * preferredAuthors[candidate.authorSlug];
    }

    // Subject affinity from shelves
    for (const s of candidate.subjects) {
      const sKey = s.toLowerCase().trim();
      if (preferredSubjects[sKey]) {
        score += 0.25 * preferredSubjects[sKey];
        matchingSubjects.push(s);
      }
    }

    // Direct pairwise similarity connection to one of user's shelved books
    let bestSourceBook: CatalogBook | null = null;
    let highestPairSim = 0;

    for (const userB of userBooks) {
      const neighbors = typedSimilarities[userB.slug] || [];
      const match = neighbors.find((n) => n.slug === candidate.slug);
      if (match && match.score > highestPairSim) {
        highestPairSim = match.score;
        bestSourceBook = userB;
      }
    }

    if (bestSourceBook && highestPairSim > 0.3) {
      score += highestPairSim * 1.5;
    }

    if (score > 0.35) {
      let reason = "";
      if (explicitInterestMatch) {
        const titleCaseInterest = explicitInterestMatch
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        reason = `Matches your interest in "${titleCaseInterest}"`;
      } else if (isExplicitGenre) {
        reason = `Selected from your chosen genre: ${candidate.genreBadge}`;
      } else if (bestSourceBook) {
        reason = `Because you shelved "${bestSourceBook.title}"`;
      } else if (preferredAuthors[candidate.authorSlug]) {
        reason = `Author match: more by ${candidate.authorName}`;
      } else if (matchingSubjects.length >= 2) {
        reason = `Strong match for your interest in ${matchingSubjects.slice(0, 2).join(' & ')}`;
      } else {
        reason = `Recommended for your ${candidate.genreBadge} taste profile`;
      }

      candidateScores.push({
        slug: candidate.slug,
        title: candidate.title,
        authorName: candidate.authorName,
        authorSlug: candidate.authorSlug,
        year: candidate.year,
        coverUrl: candidate.coverUrl,
        genreBadge: candidate.genreBadge,
        genreSlug: candidate.genreSlug,
        audienceLevel: candidate.audienceLevel,
        score,
        matchPercentage: Math.min(99, Math.max(72, Math.round(score * 12 + 65))),
        reason,
        sharedSubjects: matchingSubjects.slice(0, 3),
        sourceShelvedTitle: bestSourceBook?.title,
      });
    }
  }

  // Sort descending by calculated score
  candidateScores.sort((a, b) => b.score - a.score);

  const topRecommendations = candidateScores.slice(0, limit);

  // Craft explanation note
  let explanationNote = "";
  if (hasPreferences && preferences?.genres && preferences.genres.length > 0) {
    const genreNames = preferences.genres
      .map((gSlug) => {
        const found = ALL_CATALOG_BOOKS.find((b) => b.genreSlug === gSlug);
        return found ? found.genreBadge : gSlug;
      })
      .slice(0, 3);

    explanationNote = `Curated for your selected preferences & interests (${genreNames.join(', ')})${
      hasShelved ? ` combined with ${userBooks.length} shelved titles` : ''
    }.`;
  } else if (hasShelved) {
    explanationNote = `Personalized for you based on ${userBooks.length} book${
      userBooks.length > 1 ? "s" : ""
    } on your private shelves.`;
  } else {
    explanationNote = `Curated library recommendations based on your preferences.`;
  }

  return {
    isColdStart: false,
    explanationNote,
    recommendations: topRecommendations,
  };
}
