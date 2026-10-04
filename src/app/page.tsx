'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar, CoverflowHero, ShelfSection, ALL_GENRE_SHELVES, PersonalizedRecommendationsSection } from '@/components/library';
import {
  checkIsAuthenticated,
  clearStaleSession,
  getCurrentUser,
  UserProfile,
} from '@/lib/auth';
import { BookOpen, ShieldCheck, Sparkles, Lock, Layers, Compass, CheckCircle2 } from 'lucide-react';

export default function CommunityLibraryPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [savedBooks, setSavedBooks] = useState<string[]>([
    'the-hound-of-the-baskervilles',
    'the-time-machine',
    'meditations',
    'moby-dick',
    'pride-and-prejudice',
  ]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeGenreFilter, setActiveGenreFilter] = useState<string>('all');

  useEffect(() => {
    // Clear any stale/mismatched session data first
    clearStaleSession();

    if (!checkIsAuthenticated()) {
      router.replace('/login');
    } else {
      setCurrentUser(getCurrentUser());
      setAuthChecked(true);
    }
  }, [router]);

  const handleShelfToggle = (bookId: string) => {
    setSavedBooks((prev) => {
      const exists = prev.includes(bookId);
      const updated = exists ? prev.filter((id) => id !== bookId) : [...prev, bookId];
      setStatusMessage(
        exists ? 'Book removed from your private shelf' : 'Book added to your "Want to Read" shelf'
      );
      setTimeout(() => setStatusMessage(null), 3000);
      return updated;
    });
  };

  // Show loading/redirect screen while auth is being checked
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white px-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 mb-4 animate-pulse">
          <Lock className="h-6 w-6" />
        </div>
        <p className="text-sm font-medium text-neutral-300">Checking membership authentication...</p>
        <p className="text-xs text-neutral-500 mt-1">Redirecting to member sign in...</p>
      </div>
    );
  }

  const displayedShelves =
    activeGenreFilter === 'all'
      ? ALL_GENRE_SHELVES
      : ALL_GENRE_SHELVES.filter((shelf) => shelf.slug === activeGenreFilter);

  const totalCatalogBooks = ALL_GENRE_SHELVES.reduce((acc, s) => acc + s.books.length, 0);

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] transition-colors">
      {/* Global Navigation Bar */}
      <Navbar savedCount={savedBooks.length} />

      {/* Floating Status Notification Toast */}
      {statusMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-neutral-900/95 px-4 py-3 text-sm text-teal-300 shadow-2xl backdrop-blur-md border border-teal-500/30 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Hero Section: 3D Coverflow Rack Carousel */}
      <section id="featured-hero" className="w-full">
        <CoverflowHero
          onBookShelfToggle={handleShelfToggle}
          savedBooks={savedBooks}
        />
      </section>

      {/* Stage B: Personalized RecSys Section Based on User Shelves */}
      <PersonalizedRecommendationsSection
        savedBooks={savedBooks}
        onShelfToggle={handleShelfToggle}
      />

      {/* Genre Exploration Banner & Pills Bar */}
      <div className="sticky top-0 z-30 border-y border-white/10 bg-neutral-950/90 backdrop-blur-md px-4 py-3 shadow-lg">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30 text-xs">
                <Compass className="h-3.5 w-3.5" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
                Browse By Literary Genre
              </span>
              <span className="rounded-full bg-teal-500/10 px-2 py-0.5 text-[11px] font-medium text-teal-400 border border-teal-500/20">
                {totalCatalogBooks} Curated Volumes
              </span>
            </div>

            <div className="hidden md:flex items-center gap-2 text-xs text-neutral-400">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>50 Landmark Works per Genre · Arranged & Verified</span>
            </div>
          </div>

          {/* Horizontally scrollable genre filter pills */}
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setActiveGenreFilter('all')}
              className={`flex-none rounded-lg px-3 py-1.5 font-medium transition-all ${
                activeGenreFilter === 'all'
                  ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20'
                  : 'bg-neutral-900/80 text-neutral-400 hover:bg-neutral-800 hover:text-white border border-white/5'
              }`}
            >
              All Genres ({totalCatalogBooks})
            </button>

            {ALL_GENRE_SHELVES.map((shelf) => (
              <button
                key={shelf.slug}
                onClick={() => setActiveGenreFilter(shelf.slug)}
                className={`flex-none rounded-lg px-3 py-1.5 font-medium transition-all ${
                  activeGenreFilter === shelf.slug
                    ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20'
                    : 'bg-neutral-900/80 text-neutral-400 hover:bg-neutral-800 hover:text-white border border-white/5'
                }`}
              >
                {shelf.badge} ({shelf.books.length})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Community Content Shelves Arranged by Genre */}
      <main id="shelves" className="w-full bg-neutral-950 pb-20">
        {displayedShelves.map((shelf) => (
          <ShelfSection
            key={shelf.slug}
            title={shelf.title}
            subtitle={`${shelf.subtitle} · ${shelf.books.length} curated volumes`}
            books={shelf.books}
            onBookShelfToggle={handleShelfToggle}
            savedBooks={savedBooks}
          />
        ))}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/10 bg-neutral-950 py-12 text-neutral-400">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600/20 text-teal-400 border border-teal-500/30">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="font-serif text-base font-semibold text-white">
                Open Classics Community Library
              </p>
              <p className="text-xs text-neutral-500">
                500 public domain volumes curated and arranged across 10 literary genres. 100% tracker-free.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-neutral-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              Surveillance-Free Catalog
            </span>
            <span>·</span>
            <span>Project Gutenberg & Open Library Public Domain</span>
            <span>·</span>
            <span className="text-neutral-400">
              Signed in as <strong className="text-teal-300">{currentUser?.name}</strong>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
