'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Bookmark, BookOpen, Star, Sparkles } from 'lucide-react';

export interface FeaturedBook {
  id: string;
  title: string;
  author: string;
  year: string;
  genre: string;
  audience: 'children' | 'teen' | 'adult' | 'all';
  cover: string;
  description: string;
  pages: number;
  readUrl: string;
  rating: number;
  ratingCount: number;
  featuredReason: string;
}

export const FEATURED_HERO_BOOKS: FeaturedBook[] = [
  {
    id: 'pride_and_prejudice',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    year: '1813',
    genre: 'Classic Romance',
    audience: 'all',
    cover: '/books/pride_and_prejudice.jpg',
    description: 'A witty and romantic comedy of manners depicting the turbulent relationship between Elizabeth Bennet and the enigmatic Mr. Darcy.',
    pages: 432,
    readUrl: 'https://www.gutenberg.org/ebooks/1342',
    rating: 4.8,
    ratingCount: 342,
    featuredReason: 'Curator Pick · Timeless Literary Wit',
  },
  {
    id: 'frankenstein',
    title: 'Frankenstein',
    author: 'Mary Shelley',
    year: '1818',
    genre: 'Gothic Science Fiction',
    audience: 'teen',
    cover: '/books/frankenstein.jpg',
    description: 'The chilling tale of Victor Frankenstein and the sentient creature he creates in an unorthodox scientific experiment.',
    pages: 280,
    readUrl: 'https://www.gutenberg.org/ebooks/84',
    rating: 4.7,
    ratingCount: 290,
    featuredReason: 'Foundational Sci-Fi Classic',
  },
  {
    id: 'the_odyssey',
    title: 'The Odyssey',
    author: 'Homer',
    year: '800 BC',
    genre: 'Epic Poetry & Myth',
    audience: 'all',
    cover: '/books/the_odyssey.jpg',
    description: 'The monumental journey of Odysseus navigating mythical perils, sorceresses, and sea monsters on his ten-year voyage back to Ithaca.',
    pages: 540,
    readUrl: 'https://www.gutenberg.org/ebooks/1727',
    rating: 4.9,
    ratingCount: 418,
    featuredReason: 'Community Favorite · Epic Adventure',
  },
  {
    id: 'meditations',
    title: 'Meditations',
    author: 'Marcus Aurelius',
    year: '180 AD',
    genre: 'Stoic Philosophy',
    audience: 'adult',
    cover: '/books/meditations.jpg',
    description: 'Personal reflections and private moral exercises on resilience, duty, and tranquility by the Roman Emperor.',
    pages: 256,
    readUrl: 'https://www.gutenberg.org/ebooks/2680',
    rating: 4.95,
    ratingCount: 520,
    featuredReason: 'Most Read in Philosophy',
  },
  {
    id: 'great_gatsby',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    year: '1925',
    genre: '20th Century Fiction',
    audience: 'teen',
    cover: '/books/great_gatsby.jpg',
    description: 'A dazzling yet haunting portrait of the Jazz Age, obsessed love, and the elusive nature of the American Dream on Long Island.',
    pages: 180,
    readUrl: 'https://www.gutenberg.org/ebooks/64317',
    rating: 4.6,
    ratingCount: 388,
    featuredReason: 'Staff Highlight · Jazz Age Masterpiece',
  },
  {
    id: 'walden',
    title: 'Walden',
    author: 'Henry David Thoreau',
    year: '1854',
    genre: 'Nature & Solitude',
    audience: 'all',
    cover: '/books/walden.jpg',
    description: 'A reflective account of living simply in natural surroundings on the shores of Walden Pond, discovering life essential truths.',
    pages: 320,
    readUrl: 'https://www.gutenberg.org/ebooks/205',
    rating: 4.75,
    ratingCount: 215,
    featuredReason: 'Community Recommendation · Quiet Living',
  },
  {
    id: 'dracula',
    title: 'Dracula',
    author: 'Bram Stoker',
    year: '1897',
    genre: 'Gothic Horror',
    audience: 'teen',
    cover: '/books/dracula.jpg',
    description: 'The quintessential epistolary vampire novel chronicling Count Dracula attempt to relocate from Transylvania to Victorian England.',
    pages: 418,
    readUrl: 'https://www.gutenberg.org/ebooks/345',
    rating: 4.7,
    ratingCount: 310,
    featuredReason: 'Essential Horror Heritage',
  },
];

interface CoverflowHeroProps {
  books?: FeaturedBook[];
  onSelectShelf?: (bookId: string, shelf: string) => void;
  onBookShelfToggle?: (bookId: string) => void;
  savedBooks?: string[];
}

export function CoverflowHero({
  books = FEATURED_HERO_BOOKS,
  onSelectShelf,
  onBookShelfToggle,
  savedBooks = [],
}: CoverflowHeroProps) {
  const [activeIndex, setActiveIndex] = useState(2); // Start on The Odyssey
  const [activeShelf, setActiveShelf] = useState<{ [bookId: string]: string }>({});

  const nextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % books.length);
  };

  const prevSlide = () => {
    setActiveIndex((prev) => (prev - 1 + books.length) % books.length);
  };

  const currentBook = books[activeIndex];

  const handleShelfChange = (bookId: string, shelf: string) => {
    setActiveShelf((prev) => ({
      ...prev,
      [bookId]: prev[bookId] === shelf ? '' : shelf,
    }));
    if (onSelectShelf) {
      onSelectShelf(bookId, shelf);
    }
    if (onBookShelfToggle) {
      onBookShelfToggle(bookId);
    }
  };

  return (
    <section className="relative w-full overflow-hidden bg-neutral-950 py-12 md:py-16 text-white select-none">
      {/* Subtle Atmospheric Background Glow */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-emerald-950/20 blur-[120px] rounded-full" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[250px] bg-indigo-950/20 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header Title with Design System Typography */}
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-teal-500/30 bg-teal-950/40 text-xs font-medium text-teal-300 mb-3 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            Curated Community Showcase
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-white">
            Discover Your Next Chapter
          </h1>
          <p className="mt-2 text-sm sm:text-base text-neutral-400 max-w-xl mx-auto">
            Timeless public-domain books and community-curated classics with private reading tracking.
          </p>
        </div>

        {/* 3D Coverflow Container */}
        <div className="relative flex flex-col items-center">
          {/* Navigation Arrows */}
          <div className="absolute inset-y-0 left-2 sm:left-6 z-40 flex items-center">
            <button
              onClick={prevSlide}
              aria-label="Previous Book"
              className="p-2 sm:p-2.5 rounded-full border border-white/10 bg-neutral-900/80 text-neutral-200 hover:text-white hover:bg-neutral-800/90 transition-all hover:scale-105 active:scale-95 backdrop-blur-md shadow-lg"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          <div className="absolute inset-y-0 right-2 sm:right-6 z-40 flex items-center">
            <button
              onClick={nextSlide}
              aria-label="Next Book"
              className="p-2 sm:p-2.5 rounded-full border border-white/10 bg-neutral-900/80 text-neutral-200 hover:text-white hover:bg-neutral-800/90 transition-all hover:scale-105 active:scale-95 backdrop-blur-md shadow-lg"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* 3D Cards Stage */}
          <div
            className="relative w-full h-[320px] sm:h-[380px] flex items-center justify-center"
            style={{ perspective: '1100px' }}
          >
            {books.map((book, index) => {
              const offset = index - activeIndex;
              const absOffset = Math.abs(offset);

              // Only render slides within visible reach
              if (absOffset > 3) return null;

              // Calculate 3D transforms for Coverflow effect
              const translateX = offset * (typeof window !== 'undefined' && window.innerWidth < 640 ? 110 : 160);
              const rotateY = offset === 0 ? 0 : offset > 0 ? -32 : 32;
              const translateZ = offset === 0 ? 60 : -45 * absOffset;
              const scale = offset === 0 ? 1.05 : 0.82;
              const zIndex = 30 - absOffset;
              const opacity = absOffset === 0 ? 1 : absOffset === 1 ? 0.78 : absOffset === 2 ? 0.45 : 0.2;

              return (
                <motion.div
                  key={book.id}
                  onClick={() => setActiveIndex(index)}
                  className="absolute cursor-pointer will-change-transform"
                  style={{
                    zIndex,
                  }}
                  animate={{
                    x: translateX,
                    rotateY,
                    z: translateZ,
                    scale,
                    opacity,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 260,
                    damping: 24,
                  }}
                >
                  <div
                    className={`relative w-44 h-64 sm:w-56 sm:h-80 rounded-md overflow-hidden transition-all duration-300 ${
                      offset === 0
                        ? 'ring-2 ring-teal-400/50 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(20,184,166,0.25)]'
                        : 'shadow-[0_12px_30px_rgba(0,0,0,0.85)] filter brightness-90 hover:brightness-105'
                    }`}
                  >
                    {/* Spine Realistic Depth Gradient */}
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-white/20 via-black/40 to-transparent z-10" />

                    <Image
                      src={book.cover}
                      alt={book.title}
                      fill
                      sizes="(max-width: 640px) 180px, 240px"
                      className="object-cover"
                      priority={absOffset <= 1}
                    />

                    {/* Badge Top Left */}
                    <div className="absolute top-2 left-2 z-20">
                      <span className="px-2 py-0.5 rounded-sm bg-black/85 backdrop-blur-md text-[10px] font-semibold tracking-wider uppercase text-neutral-300 border border-white/10">
                        {book.audience}
                      </span>
                    </div>

                    {/* Penguin Classics Banner Header */}
                    <div className="absolute top-0 inset-x-0 bg-black/85 py-1 px-2 flex items-center justify-between z-10 border-b border-black/80">
                      <span className="text-[9px] font-bold tracking-widest uppercase text-neutral-200">
                        PENGUIN
                      </span>
                      <span className="text-[9px] font-semibold text-neutral-400">
                        {book.genre}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Under-Rack Caption / Metadata Panel (Inspired by 21st Coverflow) */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentBook.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28 }}
              className="mt-6 w-full max-w-2xl rounded-xl border border-white/10 bg-neutral-900/80 p-5 sm:p-6 backdrop-blur-xl shadow-2xl text-center"
            >
              {/* Reason Tag */}
              <div className="inline-block text-xs font-medium text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2.5 py-0.5 rounded-full mb-2">
                ★ {currentBook.featuredReason}
              </div>

              {/* Title & Author */}
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-white tracking-tight">
                {currentBook.title}
              </h2>
              <p className="text-sm font-medium text-teal-400 mt-1">
                by {currentBook.author} ({currentBook.year})
              </p>

              <p className="text-xs sm:text-sm text-neutral-300 mt-2.5 line-clamp-2 max-w-lg mx-auto leading-relaxed">
                {currentBook.description}
              </p>

              {/* Meta Stats Row */}
              <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-neutral-400">
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-white">{currentBook.rating}</span>
                  <span>({currentBook.ratingCount} ratings)</span>
                </div>
                <div>·</div>
                <div>{currentBook.pages} pages</div>
                <div>·</div>
                <div className="capitalize">{currentBook.genre}</div>
              </div>

              {/* Action Buttons: Shelves Tracker & Read Free */}
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleShelfChange(currentBook.id, 'want_to_read')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeShelf[currentBook.id] === 'want_to_read'
                      ? 'bg-teal-500 text-white shadow-md'
                      : 'border border-white/15 bg-neutral-800 text-neutral-200 hover:bg-neutral-700'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  {activeShelf[currentBook.id] === 'want_to_read' ? 'On Want to Read' : 'Want to Read'}
                </button>

                <button
                  type="button"
                  onClick={() => handleShelfChange(currentBook.id, 'reading')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeShelf[currentBook.id] === 'reading'
                      ? 'bg-indigo-500 text-white shadow-md'
                      : 'border border-white/15 bg-neutral-800 text-neutral-200 hover:bg-neutral-700'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  {activeShelf[currentBook.id] === 'reading' ? 'Currently Reading' : 'Reading'}
                </button>

                <Link
                  href={`/book/${currentBook.id.replace(/_/g, '-')}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-neutral-200 bg-white/10 hover:bg-white/20 border border-white/20 transition-all"
                >
                  Book Details
                </Link>

                <a
                  href={currentBook.readUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:brightness-110 shadow-md transition-all"
                >
                  Read Free on Gutenberg &rarr;
                </a>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Dots Indicator */}
          <div className="mt-6 flex items-center gap-1.5">
            {books.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                aria-label={`Go to slide ${index + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  index === activeIndex ? 'w-6 bg-teal-400' : 'w-1.5 bg-neutral-700 hover:bg-neutral-500'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
