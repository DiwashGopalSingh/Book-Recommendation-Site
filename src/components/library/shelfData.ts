import { ALL_500_BOOKS, CATALOG_GENRES } from '@/lib/catalog/books-500';
import { BookItem } from './BookShelfCarousel';

export interface GenreShelfData {
  slug: string;
  title: string;
  badge: string;
  subtitle: string;
  books: BookItem[];
}

function mapBookToItem(b: (typeof ALL_500_BOOKS)[number]): BookItem {
  const yearStr = b.year < 0 ? `${Math.abs(b.year)} BCE` : b.year.toString();
  const rating = Number((4.6 + ((b.title.length * 7) % 35) / 100).toFixed(2));
  const reviewCount = 120 + ((b.pages * 3) % 450);

  return {
    id: b.slug,
    title: b.title,
    author: b.authorName,
    year: yearStr,
    cover: b.coverUrl || '/books/the_odyssey.jpg',
    badge: b.genreBadge,
    audience: b.audienceLevel,
    rating,
    reviewCount,
    pages: b.pages,
    genre: b.genre,
    readUrl: `/book/${b.slug}`,
  };
}

export const ALL_GENRE_SHELVES: GenreShelfData[] = CATALOG_GENRES.map((g) => ({
  slug: g.slug,
  title: g.name,
  badge: g.badge,
  subtitle: g.subtitle,
  books: ALL_500_BOOKS.filter((b) => b.genreSlug === g.slug).map(mapBookToItem),
}));

export const SAMPLE_SHELVES_DATA: { [key: string]: BookItem[] } = {
  // Aliases for initial 3 shelves
  staffPicks: ALL_GENRE_SHELVES[0]?.books || [],
  philosophy: ALL_GENRE_SHELVES[2]?.books || [],
  comedyAndAdventure: ALL_GENRE_SHELVES[9]?.books || [],

  // Direct genre shelf mappings
  'mystery-crime': ALL_GENRE_SHELVES[0]?.books || [],
  'sci-fi': ALL_GENRE_SHELVES[1]?.books || [],
  'philosophy-ethics': ALL_GENRE_SHELVES[2]?.books || [],
  'adventure-sea': ALL_GENRE_SHELVES[3]?.books || [],
  'gothic-horror': ALL_GENRE_SHELVES[4]?.books || [],
  'romance-society': ALL_GENRE_SHELVES[5]?.books || [],
  'history-biography': ALL_GENRE_SHELVES[6]?.books || [],
  'childrens-ya': ALL_GENRE_SHELVES[7]?.books || [],
  'poetry-verse': ALL_GENRE_SHELVES[8]?.books || [],
  'wit-satire': ALL_GENRE_SHELVES[9]?.books || [],
};
