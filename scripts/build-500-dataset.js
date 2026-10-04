const fs = require('fs');
const path = require('path');

const mystery = require('./genres/genre-mystery.js');
const scifi = require('./genres/genre-scifi.js');
const philosophy = require('./genres/genre-philosophy.js');
const adventure = require('./genres/genre-adventure.js');
const horror = require('./genres/genre-horror.js');
const romance = require('./genres/genre-romance.js');
const history = require('./genres/genre-history.js');
const children = require('./genres/genre-children.js');
const poetry = require('./genres/genre-poetry.js');
const comedy = require('./genres/genre-comedy.js');

const GENRES = [
  {
    slug: 'mystery-crime',
    name: 'Mystery, Detective & Crime',
    badge: 'Mystery & Crime',
    subtitle: 'Brilliant sleuths, labyrinthine whodunits, and chilling criminal masterminds',
    books: mystery,
  },
  {
    slug: 'sci-fi',
    name: 'Science Fiction & Speculative Fiction',
    badge: 'Sci-Fi',
    subtitle: 'Cosmic odysseys, visionary technology, time paradoxes, and alien worlds',
    books: scifi,
  },
  {
    slug: 'philosophy',
    name: 'Philosophy, Ethics & Wisdom',
    badge: 'Philosophy',
    subtitle: 'Foundational ethics, Stoic discipline, existential inquiries, and ancient wisdom',
    books: philosophy,
  },
  {
    slug: 'adventure',
    name: 'Epic Adventure & Sea Voyages',
    badge: 'Adventure',
    subtitle: 'Treasure expeditions, perilous voyages, uncharted wilderness, and heroic quests',
    books: adventure,
  },
  {
    slug: 'gothic-horror',
    name: 'Gothic, Horror & Supernatural Chills',
    badge: 'Gothic & Horror',
    subtitle: 'Cursed ancestral manors, psychological nightmares, and cosmic dread',
    books: horror,
  },
  {
    slug: 'romance-society',
    name: 'Romance, Society & Manners',
    badge: 'Romance',
    subtitle: 'Sparkling drawing-room wit, passionate devotion, and piercing social satire',
    books: romance,
  },
  {
    slug: 'history-biography',
    name: 'Historical Chronicles & Memoirs',
    badge: 'History & Life',
    subtitle: 'Eyewitness historical accounts, landmark autobiographies, and transformative eras',
    books: history,
  },
  {
    slug: 'childrens-ya',
    name: "Children's & Young Adult Classics",
    badge: "Children's & YA",
    subtitle: 'Enchanted wonderlands, childhood friendships, and timeless coming-of-age tales',
    books: children,
  },
  {
    slug: 'poetry-verse',
    name: 'Poetry, Epics & Classical Verse',
    badge: 'Poetry & Epics',
    subtitle: 'Monumental heroic epics, lyrical meditations, and impassioned poetic reflections',
    books: poetry,
  },
  {
    slug: 'wit-satire',
    name: 'Wit, Satire & Timeless Comedy',
    badge: 'Wit & Satire',
    subtitle: 'Pungent social parodies, sparkling comedies of errors, and joyous humor',
    books: comedy,
  },
];

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

const seenSlugs = new Set();
const allBooks = [];

for (const genre of GENRES) {
  console.log(`Checking genre: ${genre.name} (${genre.books.length} books)`);
  if (genre.books.length !== 50) {
    throw new Error(`Genre ${genre.name} has ${genre.books.length} books instead of 50!`);
  }

  for (let i = 0; i < genre.books.length; i++) {
    const raw = genre.books[i];
    let baseSlug = slugify(raw.title);
    if (!baseSlug) baseSlug = `book-${genre.slug}-${i}`;

    let slug = baseSlug;
    let counter = 1;
    while (seenSlugs.has(slug)) {
      slug = `${baseSlug}-${counter++}`;
    }
    seenSlugs.add(slug);

    const authorSlug = slugify(raw.author);
    const coverUrl = raw.coverId
      ? `https://covers.openlibrary.org/b/id/${raw.coverId}-M.jpg`
      : `/books/moby-dick.jpg`;

    const book = {
      slug,
      title: raw.title,
      subtitle: raw.subtitle || undefined,
      authorName: raw.author,
      authorSlug,
      authorBio: raw.authorBio,
      year: raw.year,
      language: 'en',
      pages: raw.pages,
      subjects: raw.subjects || [genre.name],
      audienceLevel: raw.audience || 'all',
      coverUrl,
      description: raw.description,
      curatorNote: raw.curatorNote || `A foundational classic in ${genre.name}.`,
      genre: genre.name,
      genreSlug: genre.slug,
      genreBadge: genre.badge,
      gutenbergId: raw.gutenbergId || undefined,
      openLibraryWorkId: raw.openLibraryWorkId || undefined,
    };

    allBooks.push(book);
  }
}

console.log(`\n===========================================`);
console.log(`Successfully compiled exactly ${allBooks.length} books across ${GENRES.length} genres!`);
console.log(`===========================================\n`);

// 1. Write books-500.json
const jsonPath = path.join(__dirname, '..', 'src', 'lib', 'catalog', 'books-500.json');
fs.writeFileSync(jsonPath, JSON.stringify(allBooks, null, 2), 'utf-8');
console.log(`✓ Saved ${jsonPath}`);

// 2. Write books-500.ts
const tsContent = `export interface CatalogBook {
  slug: string;
  title: string;
  subtitle?: string;
  authorName: string;
  authorSlug: string;
  authorBio: string;
  year: number;
  language: string;
  pages: number;
  subjects: string[];
  audienceLevel: 'children' | 'teen' | 'adult' | 'all';
  coverUrl: string;
  description: string;
  curatorNote: string;
  genre: string;
  genreSlug: string;
  genreBadge: string;
  gutenbergId?: string;
  openLibraryWorkId?: string;
}

export interface GenreDefinition {
  slug: string;
  name: string;
  badge: string;
  subtitle: string;
}

export const CATALOG_GENRES: GenreDefinition[] = ${JSON.stringify(
  GENRES.map((g) => ({
    slug: g.slug,
    name: g.name,
    badge: g.badge,
    subtitle: g.subtitle,
  })),
  null,
  2
)};

export const ALL_500_BOOKS: CatalogBook[] = ${JSON.stringify(allBooks, null, 2)};
`;

const tsPath = path.join(__dirname, '..', 'src', 'lib', 'catalog', 'books-500.ts');
fs.writeFileSync(tsPath, tsContent, 'utf-8');
console.log(`✓ Saved ${tsPath}`);
