'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Search,
  Bookmark,
  LogOut,
  Sparkles,
  ArrowRight,
  X,
  Compass,
  Layers,
  Loader2,
} from 'lucide-react';
import { checkIsAuthenticated, getCurrentUser, logoutUser, UserProfile } from '@/lib/auth';
import { SearchResultBook } from '@/lib/catalog/search';
import { SimilarBookMatch } from '@/lib/recommend/engine';
import MyShelfModal from './MyShelfModal';

interface NavbarProps {
  onOpenAuth?: () => void;
  savedCount: number;
}

const TRENDING_TOPICS = [
  { label: 'Sherlock Holmes', q: 'Sherlock' },
  { label: 'Time Travel', q: 'Time Machine' },
  { label: 'Stoicism', q: 'Meditations' },
  { label: 'Gothic Horror', q: 'Dracula' },
  { label: 'Classic Romance', q: 'Pride and Prejudice' },
  { label: 'Dystopian Sci-Fi', q: 'H.G. Wells' },
];

export function Navbar({ onOpenAuth, savedCount }: NavbarProps) {
  const router = useRouter();
  const [navQuery, setNavQuery] = useState('');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isShelfModalOpen, setIsShelfModalOpen] = useState(false);
  const [shelfCount, setShelfCount] = useState(savedCount);
  const [loading, setLoading] = useState(false);
  const [liveResults, setLiveResults] = useState<SearchResultBook[]>([]);
  const [liveRecommendations, setLiveRecommendations] = useState<SimilarBookMatch[]>([]);
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    setShelfCount(savedCount);
  }, [savedCount]);

  // Fetch real-time shelf count and listen for cross-component shelf changes
  useEffect(() => {
    let isMounted = true;
    const loadRealShelfCount = async () => {
      try {
        const res = await fetch('/api/shelves');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && typeof data.totalShelved === 'number') {
            setShelfCount(data.totalShelved);
          }
        }
      } catch (err) {
        // silent fallback
      }
    };

    loadRealShelfCount();

    const handleShelfUpdated = (e: Event) => {
      const customEvt = e as CustomEvent;
      if (typeof customEvt?.detail?.count === 'number') {
        setShelfCount(customEvt.detail.count);
      } else {
        loadRealShelfCount();
      }
    };

    window.addEventListener('shelf-updated', handleShelfUpdated);
    return () => {
      isMounted = false;
      window.removeEventListener('shelf-updated', handleShelfUpdated);
    };
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (checkIsAuthenticated()) {
      setUser(getCurrentUser());
    } else {
      setUser(null);
    }
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live debounced search & recommendation fetch
  useEffect(() => {
    const trimmed = navQuery.trim();
    if (!trimmed) {
      setLiveResults([]);
      setLiveRecommendations([]);
      setTotalResults(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setLiveResults(data.books || []);
          setLiveRecommendations(data.recommendations || []);
          setTotalResults(data.total || 0);
          setIsOpen(true);
        }
      } catch (err) {
        console.error('Navbar live search error:', err);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [navQuery]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsOpen(false);
    if (navQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(navQuery.trim())}`);
    } else {
      router.push('/search');
    }
  };

  const handleSelectTopic = (q: string) => {
    setNavQuery(q);
    setIsOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('library_active_session');
      window.dispatchEvent(new CustomEvent('auth-changed', { detail: { user: null } }));
    }
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-neutral-950/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group flex-none">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-400 group-hover:scale-105 transition-transform">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <span className="font-serif text-lg font-bold tracking-tight text-white group-hover:text-teal-300 transition-colors">
              Open Classics
            </span>
            <span className="hidden sm:inline-block ml-1.5 text-[10px] font-semibold uppercase tracking-wider text-teal-400 bg-teal-950/60 border border-teal-500/30 px-1.5 py-0.5 rounded">
              Community
            </span>
          </div>
        </Link>

        {/* Live Search Bar with Recommendations Dropdown */}
        <div ref={containerRef} className="relative flex-1 max-w-lg mx-4 sm:mx-8">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                value={navQuery}
                onFocus={() => {
                  setIsFocused(true);
                  setIsOpen(true);
                }}
                onChange={(e) => setNavQuery(e.target.value)}
                placeholder="Search 500 classics, authors, philosophy, horror..."
                className="w-full h-10 pl-10 pr-9 rounded-xl bg-neutral-900/90 border border-white/10 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400/50 transition-all shadow-inner"
              />
              {loading ? (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-400 animate-spin" />
              ) : navQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setNavQuery('');
                    setLiveResults([]);
                    setLiveRecommendations([]);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          </form>

          {/* Autocomplete & Recommendation Overlay Dropdown */}
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl border border-white/15 bg-neutral-950/95 backdrop-blur-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {navQuery.trim() ? (
                /* Active Search State */
                <div className="max-h-[75vh] overflow-y-auto divide-y divide-white/5">
                  {/* Results Section */}
                  <div className="p-3">
                    <div className="flex items-center justify-between px-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                      <span>
                        {navQuery.trim().length === 1
                          ? `Books Starting With "${navQuery.trim().toUpperCase()}" (${totalResults})`
                          : `Books Matching "${navQuery.trim()}" (${totalResults})`}
                      </span>
                      {loading && <span className="text-teal-400 lowercase font-normal">searching...</span>}
                    </div>

                    {liveResults.length > 0 ? (
                      <div className="space-y-1">
                        {liveResults.map((book) => (
                          <Link
                            key={book.slug}
                            href={`/book/${book.slug}`}
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 p-2 rounded-xl hover:bg-neutral-900 border border-transparent hover:border-white/5 transition-colors group"
                          >
                            <img
                              src={book.coverUrl}
                              alt={book.title}
                              className="h-11 w-8 rounded object-cover flex-none bg-neutral-800 shadow"
                              loading="lazy"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-serif font-bold text-sm text-neutral-200 group-hover:text-teal-300 truncate">
                                {book.title}
                              </h4>
                              <p className="text-xs text-neutral-400 truncate mt-0.5">
                                {book.authorName} · {book.firstPublishYear || 'Classic'}
                              </p>
                            </div>
                            <span className="flex-none text-[10px] font-semibold text-neutral-300 bg-neutral-800/80 px-2 py-0.5 rounded border border-white/5">
                              {book.genreBadge}
                            </span>
                          </Link>
                        ))}
                      </div>
                    ) : !loading ? (
                      <div className="p-4 text-center text-xs text-neutral-400">
                        No direct title matches for &quot;{navQuery}&quot;. Check recommendations below!
                      </div>
                    ) : null}
                  </div>

                  {/* Recommendations Section */}
                  {liveRecommendations.length > 0 && (
                    <div className="p-3 bg-teal-950/15">
                      <div className="flex items-center gap-1.5 px-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-teal-300">
                        <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                        <span>Recommended Companions</span>
                      </div>

                      <div className="space-y-1">
                        {liveRecommendations.slice(0, 3).map((reco) => (
                          <Link
                            key={reco.slug}
                            href={`/book/${reco.slug}`}
                            onClick={() => setIsOpen(false)}
                            className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-teal-900/30 border border-transparent hover:border-teal-500/20 transition-colors group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={reco.coverUrl}
                                alt={reco.title}
                                className="h-9 w-6.5 rounded object-cover flex-none bg-neutral-800"
                                loading="lazy"
                              />
                              <div className="min-w-0">
                                <h5 className="font-serif font-bold text-xs text-neutral-200 group-hover:text-teal-200 truncate">
                                  {reco.title}
                                </h5>
                                <p className="text-[10px] text-teal-400 truncate">
                                  {reco.reason}
                                </p>
                              </div>
                            </div>
                            <span className="flex-none text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                              {reco.matchPercentage}%
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* See all results CTA */}
                  <div className="p-2.5 bg-neutral-900/50 flex items-center justify-between">
                    <button
                      onClick={() => handleSearchSubmit()}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold text-teal-300 hover:text-white bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 transition-all cursor-pointer"
                    >
                      <span>Explore all {totalResults} catalog matches for &quot;{navQuery}&quot;</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Focused & Empty State: Trending Recommendations */
                <div className="p-4">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2.5">
                    <Compass className="h-3.5 w-3.5 text-teal-400" />
                    <span>Popular Searches & Curated Genres</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {TRENDING_TOPICS.map((topic) => (
                      <button
                        key={topic.label}
                        type="button"
                        onClick={() => handleSelectTopic(topic.q)}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-900 hover:bg-teal-500/20 border border-white/5 hover:border-teal-500/30 text-neutral-300 hover:text-teal-200 transition-all cursor-pointer"
                      >
                        {topic.label}
                      </button>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-neutral-400">
                    <span className="flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5 text-teal-400" />
                      <span>500 Classic Books across 10 Genres</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSearchSubmit()}
                      className="font-semibold text-teal-400 hover:underline cursor-pointer"
                    >
                      Open Full Catalog Search →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-3 flex-none">
          {/* Shelves indicator (Opens My Shelf Modal) */}
          <button
            type="button"
            onClick={() => setIsShelfModalOpen(true)}
            className="flex items-center gap-1.5 text-xs text-neutral-300 px-3 py-1.5 rounded-lg border border-white/10 bg-neutral-900/60 hover:border-teal-500/40 hover:bg-neutral-900 transition-all cursor-pointer"
            title="Open My Reading Shelf"
          >
            <Bookmark className="h-3.5 w-3.5 text-teal-400" />
            <span className="hidden sm:inline">My Shelf:</span>
            <span className="font-semibold text-white">{shelfCount}</span>
          </button>

          {user ? (
            /* Logged-In User Profile & Sign Out */
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 rounded-lg bg-teal-950/60 border border-teal-500/30 px-3 py-1.5 text-xs text-teal-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-medium">{user.name}</span>
              </div>
              <button
                onClick={handleLogout}
                title="Sign Out of Library"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-neutral-900/80 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white hover:border-red-500/40 hover:bg-red-950/30 transition-all cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5 text-red-400" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            /* Unauthenticated -> Go to Login Page */
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 px-3.5 py-1.5 text-xs font-semibold text-neutral-950 shadow-sm transition-all"
            >
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>

      {/* Interactive My Shelf Modal */}
      <MyShelfModal
        isOpen={isShelfModalOpen}
        onClose={() => setIsShelfModalOpen(false)}
        onShelfUpdated={(cnt) => setShelfCount(cnt)}
      />
    </header>
  );
}
