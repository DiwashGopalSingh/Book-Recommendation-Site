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

export { SAMPLE_SHELVES_DATA, ALL_GENRE_SHELVES } from './shelfData';

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
