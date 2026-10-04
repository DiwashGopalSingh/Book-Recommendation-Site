'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Bookmark,
  BookOpen,
  Star,
  Sparkles,
  MoveHorizontal,
  Flame,
} from 'lucide-react';

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
    id: 'pride-and-prejudice',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    year: '1813',
    genre: 'Classic Romance',
    audience: 'all',
    cover: 'https://covers.openlibrary.org/b/id/12645114-M.jpg',
    description: 'A witty comedy of manners depicting the turbulent relationship between Elizabeth Bennet and the enigmatic Mr. Darcy.',
    pages: 432,
    readUrl: 'https://www.gutenberg.org/ebooks/1342',
    rating: 4.9,
    ratingCount: 520,
    featuredReason: '#1 Most Popular Classic · Timeless Literary Wit',
  },
  {
    id: 'frankenstein',
    title: 'Frankenstein',
    author: 'Mary Shelley',
    year: '1818',
    genre: 'Gothic Sci-Fi',
    audience: 'teen',
    cover: 'https://covers.openlibrary.org/b/id/8232063-M.jpg',
    description: 'The chilling tale of Victor Frankenstein and the sentient creature he creates in an unorthodox scientific experiment.',
    pages: 280,
    readUrl: 'https://www.gutenberg.org/ebooks/84',
    rating: 4.8,
    ratingCount: 465,
    featuredReason: 'Foundational Sci-Fi & Gothic Horror Masterwork',
  },
  {
    id: 'dracula',
    title: 'Dracula',
    author: 'Bram Stoker',
    year: '1897',
    genre: 'Gothic Horror',
    audience: 'teen',
    cover: 'https://covers.openlibrary.org/b/id/12216503-M.jpg',
    description: 'Young solicitor Jonathan Harker journeys to Transylvania to conclude a property deal with Count Dracula, uncovering an ancient bloodthirsty predator.',
    pages: 418,
    readUrl: 'https://www.gutenberg.org/ebooks/345',
    rating: 4.8,
    ratingCount: 490,
    featuredReason: 'Global Horror Phenomenon · The Ultimate Vampire Classic',
  },
  {
    id: 'the-picture-of-dorian-gray',
    title: 'The Picture of Dorian Gray',
    author: 'Oscar Wilde',
    year: '1890',
    genre: 'Gothic & Decadence',
    audience: 'teen',
    cover: 'https://covers.openlibrary.org/b/id/8232216-M.jpg',
    description: 'Dorian Gray trades his soul so that his portrait ages while he maintains unblemished youth, descending into ruthless aesthetic hedonism.',
    pages: 260,
    readUrl: 'https://www.gutenberg.org/ebooks/174',
    rating: 4.85,
    ratingCount: 512,
    featuredReason: 'Wilde\'s Crowning Masterpiece of Vanity and Sin',
  },
  {
    id: 'the-hound-of-the-baskervilles',
    title: 'The Hound of the Baskervilles',
    author: 'Arthur Conan Doyle',
    year: '1902',
    genre: 'Mystery & Crime',
    audience: 'teen',
    cover: 'https://covers.openlibrary.org/b/id/9411873-M.jpg',
    description: 'Sherlock Holmes and Dr. Watson investigate the curse of an otherworldly spectral hound haunting Dartmoor manor.',
    pages: 256,
    readUrl: 'https://www.gutenberg.org/ebooks/2852',
    rating: 4.9,
    ratingCount: 580,
    featuredReason: 'The Pinnacle of Sherlockian Deduction & Suspense',
  },
  {
    id: 'alices-adventures-in-wonderland',
    title: "Alice's Adventures in Wonderland",
    author: 'Lewis Carroll',
    year: '1865',
    genre: "Children's & YA",
    audience: 'children',
    cover: 'https://covers.openlibrary.org/b/id/8232335-M.jpg',
    description: 'Young Alice tumbles down a rabbit hole into a nonsensical wonderland populated by the White Rabbit, Mad Hatter, and Queen of Hearts.',
    pages: 160,
    readUrl: 'https://www.gutenberg.org/ebooks/11',
    rating: 4.8,
    ratingCount: 440,
    featuredReason: 'Beloved Worldwide · Masterpiece of Wonder & Imagination',
  },
  {
    id: 'the-time-machine',
    title: 'The Time Machine',
    author: 'H.G. Wells',
    year: '1895',
    genre: 'Sci-Fi Classic',
    audience: 'teen',
    cover: 'https://covers.openlibrary.org/b/id/8232043-M.jpg',
    description: 'An inventive Victorian scientist travels into the year 802,701 AD, discovering humanity fractured into the Eloi and subterranean Morlocks.',
    pages: 118,
    readUrl: 'https://www.gutenberg.org/ebooks/35',
    rating: 4.75,
    ratingCount: 395,
    featuredReason: 'The Original Time Travel Odyssey that Defined Sci-Fi',
  },
  {
    id: 'the-count-of-monte-cristo',
    title: 'The Count of Monte Cristo',
    author: 'Alexandre Dumas',
    year: '1844',
    genre: 'Epic Adventure',
    audience: 'teen',
    cover: 'https://covers.openlibrary.org/b/id/8232156-M.jpg',
    description: 'Wrongfully imprisoned in the Chateau d\'If, Edmond Dantès escapes, claims a fabulous treasure, and meticulously avenges his betrayers.',
    pages: 1276,
    readUrl: 'https://www.gutenberg.org/ebooks/1184',
    rating: 4.95,
    ratingCount: 610,
    featuredReason: 'The Ultimate Epic of Justice, Vengeance, and Triumph',
  },
  {
    id: 'moby-dick',
    title: 'Moby-Dick',
    author: 'Herman Melville',
    year: '1851',
    genre: 'Maritime Adventure',
    audience: 'teen',
    cover: 'https://covers.openlibrary.org/b/id/8232141-M.jpg',
    description: 'Ishmael sails aboard the Pequod under Captain Ahab, whose monomaniacal quest against the white sperm whale leads into cosmic fate.',
    pages: 635,
    readUrl: 'https://www.gutenberg.org/ebooks/2701',
    rating: 4.7,
    ratingCount: 420,
    featuredReason: 'Monumental Saga of Obsession and the Open Sea',
  },
  {
    id: 'jane-eyre',
    title: 'Jane Eyre',
    author: 'Charlotte Brontë',
    year: '1847',
    genre: 'Gothic Romance',
    audience: 'teen',
    cover: 'https://covers.openlibrary.org/b/id/8232244-M.jpg',
    description: 'Orphaned governess Jane Eyre falls in love with the brooding Edward Rochester at Thornfield Hall, uncovering a dark secret concealed in the attic.',
    pages: 507,
    readUrl: 'https://www.gutenberg.org/ebooks/1260',
    rating: 4.85,
    ratingCount: 475,
    featuredReason: 'Fierce Moral Independence and Unforgettable Romance',
  },
  {
    id: 'wuthering-heights',
    title: 'Wuthering Heights',
    author: 'Emily Brontë',
    year: '1847',
    genre: 'Passionate Drama',
    audience: 'teen',
    cover: 'https://covers.openlibrary.org/b/id/8232248-M.jpg',
    description: 'The destructive, supernatural passion between Heathcliff and Catherine Earnshaw on the windswept Yorkshire moors wrecks vengeance across two generations.',
    pages: 416,
    readUrl: 'https://www.gutenberg.org/ebooks/768',
    rating: 4.8,
    ratingCount: 430,
    featuredReason: 'A Raw, Untamable Force of Passionate Drama',
  },
  {
    id: 'the-odyssey',
    title: 'The Odyssey',
    author: 'Homer',
    year: '800 BC',
    genre: 'Myth & Epic Poetry',
    audience: 'all',
    cover: 'https://covers.openlibrary.org/b/id/9045853-M.jpg',
    description: 'The ten-year voyage of Odysseus navigating mythical perils, sirens, and monsters on his heroic journey back to Ithaca.',
    pages: 540,
    readUrl: 'https://www.gutenberg.org/ebooks/1727',
    rating: 4.9,
    ratingCount: 510,
    featuredReason: 'The Supreme Maritime Journey in Human Storytelling',
  },
  {
    id: 'meditations',
    title: 'Meditations',
    author: 'Marcus Aurelius',
    year: '180 AD',
    genre: 'Stoic Philosophy',
    audience: 'adult',
    cover: 'https://covers.openlibrary.org/b/id/12836246-M.jpg',
    description: 'Private spiritual reflections and moral exercises on resilience, duty, and tranquility by the Roman Emperor.',
    pages: 256,
    readUrl: 'https://www.gutenberg.org/ebooks/2680',
    rating: 4.95,
    ratingCount: 650,
    featuredReason: 'Top Read in World Philosophy · Stoic Fortress',
  },
  {
    id: 'the-adventures-of-sherlock-holmes',
    title: 'The Adventures of Sherlock Holmes',
    author: 'Arthur Conan Doyle',
    year: '1892',
    genre: 'Detective Fiction',
    audience: 'teen',
    cover: 'https://covers.openlibrary.org/b/id/12836246-M.jpg',
    description: 'Twelve quintessential Baker Street cases including "A Scandal in Bohemia", "The Red-Headed League", and "The Speckled Band".',
    pages: 307,
    readUrl: 'https://www.gutenberg.org/ebooks/1661',
    rating: 4.85,
    ratingCount: 480,
    featuredReason: 'The World’s Most Renowned Consulting Detective',
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
  const [activeIndex, setActiveIndex] = useState(2); // Start on Dracula / Hound
  const [activeShelf, setActiveShelf] = useState<{ [bookId: string]: string }>({});

  // Real-time drag-clicking states
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const hasDragged = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const nextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % books.length);
  };

  const prevSlide = () => {
    setActiveIndex((prev) => (prev - 1 + books.length) % books.length);
  };

  const currentBook = books[activeIndex];

  // Drag interaction handlers
  const handlePointerDown = (clientX: number) => {
    setIsDragging(true);
    setDragStartX(clientX);
    setDragOffset(0);
    hasDragged.current = false;
  };

  const handlePointerMove = (clientX: number) => {
    if (!isDragging) return;
    const diff = clientX - dragStartX;
    setDragOffset(diff);
    if (Math.abs(diff) > 8) {
      hasDragged.current = true;
    }
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = 40; // minimum drag distance in pixels to trigger slide
    if (dragOffset < -threshold) {
      nextSlide();
    } else if (dragOffset > threshold) {
      prevSlide();
    }
    setDragOffset(0);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [books.length]);

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
    <section className="relative w-full overflow-hidden bg-[#FAF7F2] py-10 md:py-16 text-stone-900 select-none">
      {/* Subtle Atmospheric Warm Cream Glow */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[360px] bg-amber-200/25 blur-[140px] rounded-full" />
        <div className="absolute top-1/3 left-1/3 w-[450px] h-[260px] bg-teal-200/20 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header Title with Design System Typography */}
        <div className="text-center mb-6 md:mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-600/30 bg-amber-100/70 text-xs font-bold text-amber-900 mb-2.5 backdrop-blur-md shadow-xs">
            <Flame className="w-3.5 h-3.5 text-amber-600" />
            Most Popular Landmark Books
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-stone-900">
            Discover Your Next Chapter
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-stone-600 max-w-xl mx-auto">
            14 of the world’s most celebrated literary classics. Drag or swipe across the rack to explore.
          </p>

          {/* Interactive Drag Hint */}
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#E5DDD0] bg-white/90 px-3.5 py-1 text-[11px] font-medium text-stone-700 shadow-xs backdrop-blur-sm">
            <MoveHorizontal className="w-3 h-3 text-teal-700 animate-pulse" />
            <span>Click &amp; Drag horizontally to slide books</span>
          </div>
        </div>

        {/* 3D Coverflow Container */}
        <div className="relative flex flex-col items-center">
          {/* Navigation Arrows */}
          <div className="absolute inset-y-0 left-1 sm:left-4 z-40 flex items-center pointer-events-auto">
            <button
              onClick={prevSlide}
              aria-label="Previous Book"
              className="p-2 sm:p-2.5 rounded-full border border-[#E5DDD0] bg-white text-stone-700 hover:text-stone-900 hover:bg-[#FAF7F2] transition-all hover:scale-105 active:scale-95 shadow-md"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          <div className="absolute inset-y-0 right-1 sm:right-4 z-40 flex items-center pointer-events-auto">
            <button
              onClick={nextSlide}
              aria-label="Next Book"
              className="p-2 sm:p-2.5 rounded-full border border-[#E5DDD0] bg-white text-stone-700 hover:text-stone-900 hover:bg-[#FAF7F2] transition-all hover:scale-105 active:scale-95 shadow-md"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* 3D Cards Stage with Drag-Click Support */}
          <div
            ref={containerRef}
            onMouseDown={(e) => handlePointerDown(e.clientX)}
            onMouseMove={(e) => handlePointerMove(e.clientX)}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={(e) => handlePointerDown(e.touches[0].clientX)}
            onTouchMove={(e) => handlePointerMove(e.touches[0].clientX)}
            onTouchEnd={handlePointerUp}
            className={`relative w-full h-[330px] sm:h-[400px] flex items-center justify-center select-none touch-pan-y ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            style={{ perspective: '1150px' }}
          >
            {books.map((book, index) => {
              const step = typeof window !== 'undefined' && window.innerWidth < 640 ? 115 : 165;
              const dragFraction = isDragging ? dragOffset / step : 0;

              // Infinite circular loop distance calculation
              const N = books.length;
              let circularDiff = (index - activeIndex) % N;
              if (circularDiff > N / 2) circularDiff -= N;
              if (circularDiff < -N / 2) circularDiff += N;

              const effectiveOffset = circularDiff + dragFraction;
              const absOffset = Math.abs(effectiveOffset);

              // Render visible slides in range (±3.8 covers 7 books seamlessly)
              if (absOffset > 3.8) return null;

              // Calculate 3D transforms for Coverflow effect with dynamic drag displacement
              const translateX = effectiveOffset * step;
              const rotateY = Math.max(-40, Math.min(40, -effectiveOffset * 28));
              const translateZ = -38 * absOffset + (absOffset < 0.6 ? 50 * (1 - absOffset * 1.66) : 0);
              const scale = Math.max(0.74, 1.05 - absOffset * 0.12);
              const zIndex = Math.round(50 - absOffset * 10);
              const opacity = Math.max(0.12, 1 - absOffset * 0.28);

              return (
                <motion.div
                  key={book.id}
                  initial={false}
                  onClick={(e) => {
                    if (hasDragged.current) {
                      e.preventDefault();
                      e.stopPropagation();
                      return;
                    }
                    setActiveIndex(index);
                  }}
                  className="absolute will-change-transform"
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
                    type: isDragging ? 'tween' : 'spring',
                    stiffness: 280,
                    damping: 26,
                    duration: isDragging ? 0.05 : undefined,
                  }}
                >
                  <div
                    className={`relative w-44 h-64 sm:w-56 sm:h-80 rounded-lg overflow-hidden transition-all duration-300 ${
                      Math.abs(effectiveOffset) < 0.5
                        ? 'ring-2 ring-teal-600 shadow-[0_20px_45px_rgba(50,30,10,0.22),0_0_35px_rgba(13,148,136,0.25)]'
                        : 'shadow-[0_12px_28px_rgba(50,30,10,0.12)] filter brightness-95 hover:brightness-100'
                    }`}
                  >
                    {/* Spine Realistic Depth Gradient */}
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-white/30 via-black/30 to-transparent z-10" />

                    <Image
                      src={book.cover}
                      alt={book.title}
                      fill
                      sizes="(max-width: 640px) 180px, 240px"
                      className="object-cover pointer-events-none"
                      priority={absOffset <= 1}
                    />

                    {/* Badge Top Left */}
                    <div className="absolute top-2 left-2 z-20">
                      <span className="px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[10px] font-semibold tracking-wider uppercase text-teal-300 border border-teal-500/30">
                        {book.audience}
                      </span>
                    </div>

                    {/* Book Spine / Genre Top Banner */}
                    <div className="absolute top-0 inset-x-0 bg-neutral-950/80 py-1 px-2 flex items-center justify-between z-10 border-b border-white/10">
                      <span className="text-[9px] font-bold tracking-widest uppercase text-white">
                        CLASSIC
                      </span>
                      <span className="text-[9px] font-semibold text-neutral-300">
                        {book.genre}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Under-Rack Caption / Metadata Panel */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentBook.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="mt-6 w-full max-w-2xl rounded-2xl border border-[#E5DDD0] bg-white/95 p-5 sm:p-6 backdrop-blur-xl shadow-xl text-center text-stone-900"
            >
              {/* Reason Tag */}
              <div className="inline-block text-xs font-bold text-amber-900 bg-amber-100/90 border border-amber-300/80 px-3 py-1 rounded-full mb-2.5 shadow-xs">
                ★ {currentBook.featuredReason}
              </div>

              {/* Title & Author */}
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
                {currentBook.title}
              </h2>
              <p className="text-sm font-semibold text-teal-700 mt-1">
                by {currentBook.author} ({currentBook.year})
              </p>

              <p className="text-xs sm:text-sm text-stone-600 mt-2.5 line-clamp-2 max-w-lg mx-auto leading-relaxed">
                {currentBook.description}
              </p>

              {/* Meta Stats Row */}
              <div className="mt-4 pt-3 border-t border-[#EAE3D6] flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-stone-500">
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span className="font-bold text-stone-900">{currentBook.rating}</span>
                  <span>({currentBook.ratingCount} reviews)</span>
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
                    activeShelf[currentBook.id] === 'want_to_read' || savedBooks.includes(currentBook.id)
                      ? 'bg-teal-700 text-white shadow-sm'
                      : 'border border-[#DDD5C7] bg-[#F3EDE3] text-stone-800 hover:bg-[#EAE2D6]'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  {savedBooks.includes(currentBook.id) ? 'On My Shelf' : 'Want to Read'}
                </button>

                <button
                  type="button"
                  onClick={() => handleShelfChange(currentBook.id, 'reading')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeShelf[currentBook.id] === 'reading'
                      ? 'bg-indigo-700 text-white shadow-sm'
                      : 'border border-[#DDD5C7] bg-[#F3EDE3] text-stone-800 hover:bg-[#EAE2D6]'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  {activeShelf[currentBook.id] === 'reading' ? 'Currently Reading' : 'Reading'}
                </button>

                <Link
                  href={`/book/${currentBook.id}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-stone-800 bg-[#F3EDE3] hover:bg-[#EAE2D6] border border-[#DDD5C7] transition-all"
                >
                  Book Details
                </Link>

                <a
                  href={currentBook.readUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-teal-700 to-emerald-700 hover:brightness-105 shadow-sm transition-all"
                >
                  Read Free on Gutenberg &rarr;
                </a>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Dots Indicator */}
          <div className="mt-6 flex items-center gap-1.5 max-w-full overflow-x-auto py-1">
            {books.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                aria-label={`Go to slide ${index + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  index === activeIndex ? 'w-6 bg-teal-700' : 'w-1.5 bg-stone-300 hover:bg-stone-400'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
