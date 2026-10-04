'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Bookmark, Star, BookOpen, Check } from 'lucide-react';

export interface BookItem {
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
}

export interface ShelfSectionProps {
  title: string;
  subtitle?: string;
  books: BookItem[];
  onBookShelfToggle?: (bookId: string) => void;
  savedBooks?: string[];
}

export const SAMPLE_SHELVES_DATA: { [key: string]: BookItem[] } = {
  staffPicks: [
    {
      id: 'pride_and_prejudice',
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      year: '1813',
      cover: '/books/pride_and_prejudice.jpg',
      badge: 'Staff Pick',
      audience: 'all',
      rating: 4.88,
      reviewCount: 342,
      pages: 432,
      genre: 'Romance',
      readUrl: 'https://www.gutenberg.org/ebooks/1342',
    },
    {
      id: 'frankenstein',
      title: 'Frankenstein',
      author: 'Mary Shelley',
      year: '1818',
      cover: '/books/frankenstein.jpg',
      badge: 'Classic',
      audience: 'teen',
      rating: 4.75,
      reviewCount: 290,
      pages: 280,
      genre: 'Gothic',
      readUrl: 'https://www.gutenberg.org/ebooks/84',
    },
    {
      id: 'alice_in_wonderland',
      title: "Alice's Adventures in Wonderland",
      author: 'Lewis Carroll',
      year: '1865',
      cover: '/books/alice_in_wonderland.jpg',
      badge: 'Staff Pick',
      audience: 'children',
      rating: 4.86,
      reviewCount: 460,
      pages: 192,
      genre: 'Fantasy',
      readUrl: 'https://www.gutenberg.org/ebooks/11',
    },
    {
      id: 'the_odyssey',
      title: 'The Odyssey',
      author: 'Homer',
      year: '800 BC',
      cover: '/books/the_odyssey.jpg',
      badge: 'Epic',
      audience: 'all',
      rating: 4.92,
      reviewCount: 418,
      pages: 540,
      genre: 'Mythology',
      readUrl: 'https://www.gutenberg.org/ebooks/1727',
    },
    {
      id: 'moby_dick',
      title: 'Moby Dick',
      author: 'Herman Melville',
      year: '1851',
      cover: '/books/moby_dick.jpg',
      badge: 'Masterpiece',
      audience: 'teen',
      rating: 4.79,
      reviewCount: 375,
      pages: 635,
      genre: 'Adventure',
      readUrl: 'https://www.gutenberg.org/ebooks/2701',
    },
    {
      id: 'picture_of_dorian_gray',
      title: 'The Picture of Dorian Gray',
      author: 'Oscar Wilde',
      year: '1890',
      cover: '/books/picture_of_dorian_gray.jpg',
      badge: 'Gothic',
      audience: 'teen',
      rating: 4.88,
      reviewCount: 395,
      pages: 254,
      genre: 'Drama',
      readUrl: 'https://www.gutenberg.org/ebooks/174',
    },
    {
      id: 'great_gatsby',
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      year: '1925',
      cover: '/books/great_gatsby.jpg',
      badge: 'Original',
      audience: 'teen',
      rating: 4.65,
      reviewCount: 388,
      pages: 180,
      genre: 'Fiction',
      readUrl: 'https://www.gutenberg.org/ebooks/64317',
    },
    {
      id: 'dracula',
      title: 'Dracula',
      author: 'Bram Stoker',
      year: '1897',
      cover: '/books/dracula.jpg',
      badge: 'Staff Pick',
      audience: 'teen',
      rating: 4.78,
      reviewCount: 310,
      pages: 418,
      genre: 'Horror',
      readUrl: 'https://www.gutenberg.org/ebooks/345',
    },
    {
      id: 'jane_eyre',
      title: 'Jane Eyre',
      author: 'Charlotte Brontë',
      year: '1847',
      cover: '/books/jane_eyre.jpg',
      badge: 'Classic',
      audience: 'all',
      rating: 4.84,
      reviewCount: 265,
      pages: 507,
      genre: 'Drama',
      readUrl: 'https://www.gutenberg.org/ebooks/1260',
    },
  ],
  philosophy: [
    {
      id: 'meditations',
      title: 'Meditations',
      author: 'Marcus Aurelius',
      year: '180 AD',
      cover: '/books/meditations.jpg',
      badge: 'Stoicism',
      audience: 'adult',
      rating: 4.95,
      reviewCount: 520,
      pages: 256,
      genre: 'Philosophy',
      readUrl: 'https://www.gutenberg.org/ebooks/2680',
    },
    {
      id: 'crime_and_punishment',
      title: 'Crime and Punishment',
      author: 'Fyodor Dostoevsky',
      year: '1866',
      cover: '/books/crime_and_punishment.jpg',
      badge: 'Masterpiece',
      audience: 'adult',
      rating: 4.91,
      reviewCount: 470,
      pages: 430,
      genre: 'Psychological',
      readUrl: 'https://www.gutenberg.org/ebooks/2554',
    },
    {
      id: 'the_republic',
      title: 'The Republic',
      author: 'Plato',
      year: '375 BC',
      cover: '/books/the_republic.jpg',
      badge: 'Essential',
      audience: 'adult',
      rating: 4.82,
      reviewCount: 315,
      pages: 416,
      genre: 'Philosophy',
      readUrl: 'https://www.gutenberg.org/ebooks/1497',
    },
    {
      id: 'beyond_good_and_evil',
      title: 'Beyond Good and Evil',
      author: 'Friedrich Nietzsche',
      year: '1886',
      cover: '/books/beyond_good_and_evil.jpg',
      badge: 'Provocative',
      audience: 'adult',
      rating: 4.71,
      reviewCount: 240,
      pages: 288,
      genre: 'Philosophy',
      readUrl: 'https://www.gutenberg.org/ebooks/4363',
    },
    {
      id: 'metamorphosis',
      title: 'The Metamorphosis',
      author: 'Franz Kafka',
      year: '1915',
      cover: '/books/metamorphosis.jpg',
      badge: 'Existential',
      audience: 'adult',
      rating: 4.83,
      reviewCount: 390,
      pages: 100,
      genre: 'Fiction',
      readUrl: 'https://www.gutenberg.org/ebooks/5200',
    },
    {
      id: 'frederick_douglass',
      title: 'Narrative of the Life of Frederick Douglass',
      author: 'Frederick Douglass',
      year: '1845',
      cover: '/books/frederick_douglass.jpg',
      badge: 'Biography',
      audience: 'all',
      rating: 4.94,
      reviewCount: 340,
      pages: 144,
      genre: 'Philosophy',
      readUrl: 'https://www.gutenberg.org/ebooks/23',
    },
    {
      id: 'the_prince',
      title: 'The Prince',
      author: 'Niccolò Machiavelli',
      year: '1532',
      cover: '/books/the_prince.jpg',
      badge: 'Classic',
      audience: 'adult',
      rating: 4.68,
      reviewCount: 275,
      pages: 140,
      genre: 'Political',
      readUrl: 'https://www.gutenberg.org/ebooks/1232',
    },
    {
      id: 'walden',
      title: 'Walden',
      author: 'Henry David Thoreau',
      year: '1854',
      cover: '/books/walden.jpg',
      badge: 'Nature',
      audience: 'all',
      rating: 4.76,
      reviewCount: 215,
      pages: 320,
      genre: 'Philosophy',
      readUrl: 'https://www.gutenberg.org/ebooks/205',
    },
  ],
  comedyAndAdventure: [
    {
      id: 'sherlock_holmes',
      title: 'The Adventures of Sherlock Holmes',
      author: 'Arthur Conan Doyle',
      year: '1892',
      cover: '/books/sherlock_holmes.jpg',
      badge: 'Mystery',
      audience: 'all',
      rating: 4.90,
      reviewCount: 480,
      pages: 307,
      genre: 'Mystery',
      readUrl: 'https://www.gutenberg.org/ebooks/1661',
    },
    {
      id: 'treasure_island',
      title: 'Treasure Island',
      author: 'Robert Louis Stevenson',
      year: '1883',
      cover: '/books/treasure_island.jpg',
      badge: 'Adventure',
      audience: 'all',
      rating: 4.85,
      reviewCount: 345,
      pages: 292,
      genre: 'Adventure',
      readUrl: 'https://www.gutenberg.org/ebooks/120',
    },
    {
      id: 'the_time_machine',
      title: 'The Time Machine',
      author: 'H.G. Wells',
      year: '1895',
      cover: '/books/the_time_machine.jpg',
      badge: 'Sci-Fi',
      audience: 'teen',
      rating: 4.77,
      reviewCount: 310,
      pages: 118,
      genre: 'Adventure',
      readUrl: 'https://www.gutenberg.org/ebooks/35',
    },
    {
      id: 'three_men_in_a_boat',
      title: 'Three Men in a Boat',
      author: 'Jerome K. Jerome',
      year: '1889',
      cover: '/books/three_men_in_a_boat.jpg',
      badge: 'Hilarious',
      audience: 'all',
      rating: 4.85,
      reviewCount: 198,
      pages: 240,
      genre: 'Comedy',
      readUrl: 'https://www.gutenberg.org/ebooks/308',
    },
    {
      id: 'importance_of_being_earnest',
      title: 'The Importance of Being Earnest',
      author: 'Oscar Wilde',
      year: '1895',
      cover: '/books/importance_of_being_earnest.jpg',
      badge: 'Satire',
      audience: 'teen',
      rating: 4.9,
      reviewCount: 350,
      pages: 120,
      genre: 'Comedy',
      readUrl: 'https://www.gutenberg.org/ebooks/844',
    },
    {
      id: 'don_quixote',
      title: 'Don Quixote',
      author: 'Miguel de Cervantes',
      year: '1605',
      cover: '/books/don_quixote.jpg',
      badge: 'Masterpiece',
      audience: 'all',
      rating: 4.89,
      reviewCount: 412,
      pages: 860,
      genre: 'Adventure',
      readUrl: 'https://www.gutenberg.org/ebooks/996',
    },
    {
      id: 'emma',
      title: 'Emma',
      author: 'Jane Austen',
      year: '1815',
      cover: '/books/emma.jpg',
      badge: 'Popular',
      audience: 'all',
      rating: 4.79,
      reviewCount: 280,
      pages: 474,
      genre: 'Romcom',
      readUrl: 'https://www.gutenberg.org/ebooks/158',
    },
    {
      id: 'voyage_of_the_beagle',
      title: 'The Voyage of the Beagle',
      author: 'Charles Darwin',
      year: '1839',
      cover: '/books/voyage_of_the_beagle.jpg',
      badge: 'Science',
      audience: 'all',
      rating: 4.74,
      reviewCount: 160,
      pages: 512,
      genre: 'Documentary',
      readUrl: 'https://www.gutenberg.org/ebooks/944',
    },
  ],
  worldClassics: [
    {
      id: 'tale_of_two_cities',
      title: 'A Tale of Two Cities',
      author: 'Charles Dickens',
      year: '1859',
      cover: '/books/tale_of_two_cities.jpg',
      badge: 'Historical',
      audience: 'all',
      rating: 4.82,
      reviewCount: 420,
      pages: 448,
      genre: 'Drama',
      readUrl: 'https://www.gutenberg.org/ebooks/98',
    },
    {
      id: 'war_and_peace',
      title: 'War and Peace',
      author: 'Leo Tolstoy',
      year: '1869',
      cover: '/books/war_and_peace.jpg',
      badge: 'Monumental',
      audience: 'adult',
      rating: 4.89,
      reviewCount: 510,
      pages: 1225,
      genre: 'Drama',
      readUrl: 'https://www.gutenberg.org/ebooks/2600',
    },
    {
      id: 'little_women',
      title: 'Little Women',
      author: 'Louisa May Alcott',
      year: '1868',
      cover: '/books/little_women.jpg',
      badge: 'Beloved',
      audience: 'all',
      rating: 4.87,
      reviewCount: 380,
      pages: 449,
      genre: 'Family',
      readUrl: 'https://www.gutenberg.org/ebooks/514',
    },
    {
      id: 'wuthering_heights',
      title: 'Wuthering Heights',
      author: 'Emily Brontë',
      year: '1847',
      cover: '/books/wuthering_heights.jpg',
      badge: 'Gothic',
      audience: 'teen',
      rating: 4.78,
      reviewCount: 325,
      pages: 416,
      genre: 'Romance',
      readUrl: 'https://www.gutenberg.org/ebooks/768',
    },
    {
      id: 'sense_and_sensibility',
      title: 'Sense and Sensibility',
      author: 'Jane Austen',
      year: '1811',
      cover: '/books/sense_and_sensibility.jpg',
      badge: 'Classic',
      audience: 'all',
      rating: 4.81,
      reviewCount: 295,
      pages: 409,
      genre: 'Romance',
      readUrl: 'https://www.gutenberg.org/ebooks/161',
    },
  ],
};

export const BookCard = ({
  book,
  isSaved,
  onToggleSave,
}: {
  book: BookItem;
  isSaved: boolean;
  onToggleSave: () => void;
}) => (
  <div className="group relative flex h-[340px] w-full flex-col overflow-hidden rounded-xl border border-white/10 bg-neutral-900/80 shadow-md transition-all duration-300 hover:shadow-xl hover:border-teal-500/40 backdrop-blur-md">
    {/* Card Image Container */}
    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-xl bg-neutral-950">
      <Image
        alt={book.title}
        src={book.cover}
        fill
        sizes="(max-width: 768px) 180px, 220px"
        className="object-cover transition-transform duration-300 group-hover:scale-105"
      />

      {/* Spine highlight */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-white/20 via-black/30 to-transparent z-10" />

      {/* Bookmark / Shelf Action Button (Top Right) */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleSave();
        }}
        className={`absolute top-2 right-2 z-20 p-2 rounded-full backdrop-blur-md transition-all shadow-md ${
          isSaved
            ? 'bg-teal-500 text-white hover:bg-teal-600'
            : 'bg-black/60 text-neutral-300 hover:text-white hover:bg-black/80'
        }`}
        aria-label={isSaved ? 'Remove from shelf' : 'Add to shelf'}
      >
        {isSaved ? <Check className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
      </button>

      {/* Audience / Curation Badge (Top Left) */}
      {book.badge && (
        <span className="absolute top-2 left-2 z-20 rounded-md bg-black/80 px-2 py-0.5 font-medium text-teal-300 border border-teal-500/30 text-[10px] uppercase tracking-wider backdrop-blur-md">
          {book.badge}
        </span>
      )}
    </div>

    {/* Content Info */}
    <div className="flex flex-1 flex-col justify-between p-3">
      <div>
        <Link href={`/book/${book.id.replace(/_/g, '-')}`} className="block">
          <h3 className="font-serif font-medium text-sm text-white line-clamp-1 tracking-tight hover:text-teal-300 transition-colors">
            {book.title}
          </h3>
        </Link>
        <p className="text-neutral-400 text-xs mt-0.5 line-clamp-1">
          {book.author} · {book.year}
        </p>
      </div>

      {/* Card Footer */}
      <div className="mt-auto pt-2 border-t border-white/5 flex items-center justify-between text-xs text-neutral-400">
        <span className="flex items-center gap-1">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          <span className="font-semibold text-white">{book.rating}</span>
          <span className="text-[10px] text-neutral-500">({book.reviewCount})</span>
        </span>
        <span className="text-[11px] font-medium text-emerald-400">
          {book.pages} pages
        </span>
      </div>
    </div>
  </div>
);

export const ShelfSection = ({
  title,
  subtitle,
  books = [],
  onBookShelfToggle,
  savedBooks = [],
}: ShelfSectionProps) => {
  const scrollContainer = useRef<HTMLDivElement>(null);

  const handleScrollLeft = () => {
    if (scrollContainer.current) {
      scrollContainer.current.scrollBy({ left: -340, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainer.current) {
      scrollContainer.current.scrollBy({ left: 340, behavior: 'smooth' });
    }
  };

  return (
    <section className="w-full py-6 sm:py-8 border-b border-white/5">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        {/* Shelf Header */}
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="font-serif font-medium text-xl sm:text-2xl text-white tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleScrollLeft}
              className="p-1.5 rounded-full border border-white/10 bg-neutral-900 text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleScrollRight}
              className="p-1.5 rounded-full border border-white/10 bg-neutral-900 text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Horizontally Scrollable Cards Container */}
        <div
          ref={scrollContainer}
          className="no-scrollbar -mx-2 flex snap-x snap-mandatory gap-4 overflow-x-auto px-2 pb-3"
        >
          {(books || []).map((book) => {
            const isSaved = savedBooks.includes(book.id);
            return (
              <div
                key={book.id}
                className="w-[190px] sm:w-[220px] flex-none snap-start"
              >
                <BookCard
                  book={book}
                  isSaved={isSaved}
                  onToggleSave={() => onBookShelfToggle && onBookShelfToggle(book.id)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
