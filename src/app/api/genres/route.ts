import { NextResponse } from "next/server";
import { searchCatalog, SearchResultBook } from "@/lib/catalog/search";

export interface GenreShelf {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  books: {
    id: string;
    title: string;
    author: string;
    year: string;
    cover: string;
    badge?: string;
    audience: 'children' | 'teen' | 'adult' | 'all';
    rating: number;
    reviewCount: number;
    pages: number;
    genre: string;
    readUrl: string;
  }[];
}

const GENRE_CONFIGS = [
  {
    id: "detective",
    title: "Detective, Crime & Whodunit Mysteries",
    subtitle: "Ingenious sleuths, master criminals, and puzzling enigmas by Agatha Christie, Conan Doyle, and more",
    badge: "Mystery & Crime",
    subjectFilter: "Detective",
    limit: 50,
  },
  {
    id: "scifi",
    title: "Science Fiction & Speculative Worlds",
    subtitle: "Futuristic visions, cosmic explorations, and visionary speculations across time and space",
    badge: "Sci-Fi",
    subjectFilter: "Science Fiction",
    limit: 40,
  },
  {
    id: "philosophy",
    title: "Timeless Philosophy, Wisdom & Ethics",
    subtitle: "Stoic meditations, existential treatises, and moral foundations from antiquity to modern thought",
    badge: "Philosophy",
    subjectFilter: "Philosophy",
    limit: 40,
  },
  {
    id: "adventure",
    title: "Epic Adventure, Sea Voyages & Odysseys",
    subtitle: "Perilous quests, high-seas daring, and uncharted expeditions into the unknown",
    badge: "Adventure",
    subjectFilter: "Adventure",
    limit: 50,
  },
  {
    id: "horror",
    title: "Gothic Tales, Horror & Supernatural Chills",
    subtitle: "Haunting manors, cosmic dread, and psychological terror from masters of the uncanny",
    badge: "Gothic & Horror",
    subjectFilter: "Horror",
    limit: 30,
  },
  {
    id: "romance",
    title: "Romance, Society & Manners",
    subtitle: "Social intrigues, witty courtships, and heartfelt domestic drama of the 19th and 20th centuries",
    badge: "Romance",
    subjectFilter: "Romance",
    limit: 45,
  },
  {
    id: "biography",
    title: "Historical Chronicles, Memoirs & Biographies",
    subtitle: "First-hand accounts, revolutionary lives, and historical chronicles shaping civilization",
    badge: "History & Life",
    subjectFilter: "Biographies",
    limit: 40,
  },
  {
    id: "classics",
    title: "World Classics & Enduring Literary Masterpieces",
    subtitle: "Universally celebrated monuments of world literature spanning centuries",
    badge: "World Classic",
    subjectFilter: "Classic",
    limit: 50,
  },
];

function transformBook(b: SearchResultBook, defaultBadge: string) {
  const yearStr = b.firstPublishYear
    ? b.firstPublishYear < 0
      ? `${Math.abs(b.firstPublishYear)} BCE`
      : b.firstPublishYear.toString()
    : "Public Domain";

  return {
    id: b.slug,
    title: b.title,
    author: b.authorName,
    year: yearStr,
    cover: b.coverUrl || "/books/the_odyssey.jpg",
    badge: defaultBadge,
    audience: (b.audienceLevel as any) || "all",
    rating: 4.8,
    reviewCount: Math.min(999, Math.max(85, Math.floor(b.pageCount * 0.95))),
    pages: b.pageCount || 240,
    genre: b.subjects?.[0] || defaultBadge,
    readUrl: `/book/${b.slug}`,
  };
}

export async function GET() {
  try {
    const shelves: GenreShelf[] = [];

    // Query each genre shelf in parallel
    const promises = GENRE_CONFIGS.map(async (config) => {
      const searchRes = await searchCatalog({
        subject: config.subjectFilter,
        limit: config.limit,
      });

      const books = searchRes.books.map((b) => transformBook(b, config.badge));

      return {
        id: config.id,
        title: config.title,
        subtitle: `${config.subtitle} (${searchRes.total} titles)`,
        badge: config.badge,
        books,
      };
    });

    const results = await Promise.all(promises);

    // Only include shelves that have books
    for (const shelf of results) {
      if (shelf.books.length > 0) {
        shelves.push(shelf);
      }
    }

    return NextResponse.json({ shelves });
  } catch (error) {
    console.error("GET /api/genres error:", error);
    return NextResponse.json({ error: "Failed to load genre shelves" }, { status: 500 });
  }
}
