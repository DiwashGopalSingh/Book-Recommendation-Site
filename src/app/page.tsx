'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar, CoverflowHero, ShelfSection, ALL_GENRE_SHELVES, PersonalizedRecommendationsSection } from '@/components/library';
import { AuthTabs } from '@/components/auth';
import {
  checkIsAuthenticated,
  clearStaleSession,
  getCurrentUser,
  signInUser,
  signUpUser,
  logoutUser,
  DUMMY_ACCOUNT,
  UserProfile,
} from '@/lib/auth';
import {
  BookOpen,
  ShieldCheck,
  Sparkles,
  Lock,
  Layers,
  Compass,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';

export default function CommunityLibraryPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [savedBooks, setSavedBooks] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeGenreFilter, setActiveGenreFilter] = useState<string>('all');

  // Login form state
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Check authentication on mount - opens with Login section unless actively signed in
  useEffect(() => {
    const hasActiveSession =
      typeof window !== 'undefined' &&
      sessionStorage.getItem('library_active_session') === 'true';

    if (hasActiveSession && checkIsAuthenticated()) {
      setCurrentUser(getCurrentUser());
    } else {
      setCurrentUser(null);
    }
    setAuthChecked(true);

    const handleAuthChanged = (e: Event) => {
      const customEvt = e as CustomEvent;
      if (customEvt?.detail?.user) {
        setCurrentUser(customEvt.detail.user);
      } else {
        setCurrentUser(null);
      }
    };

    window.addEventListener('auth-changed', handleAuthChanged);
    return () => window.removeEventListener('auth-changed', handleAuthChanged);
  }, []);

  // Load real saved shelves on mount
  useEffect(() => {
    let isMounted = true;
    const fetchShelvedBooks = async () => {
      try {
        const res = await fetch('/api/shelves');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.shelves)) {
            const identifiers = data.shelves.flatMap((s: { work_id: string; slug: string }) => [
              s.work_id,
              s.slug,
            ]);
            setSavedBooks(Array.from(new Set(identifiers)));
          }
        }
      } catch (err) {
        console.error('Failed to load user shelves:', err);
      }
    };

    fetchShelvedBooks();

    const handleShelfUpdated = () => {
      fetchShelvedBooks();
    };

    window.addEventListener('shelf-updated', handleShelfUpdated);
    return () => {
      isMounted = false;
      window.removeEventListener('shelf-updated', handleShelfUpdated);
    };
  }, []);

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (authError) setAuthError(null);
  };

  const handleToggleMode = () => {
    setIsSignUp((prev) => !prev);
    setAuthError(null);
  };

  const handleAutoFillDemo = () => {
    setFormData({
      name: DUMMY_ACCOUNT.name,
      email: DUMMY_ACCOUNT.email,
      password: DUMMY_ACCOUNT.password,
    });
    setAuthError(null);
    setStatusMessage('Demo credentials filled! Click "Sign In to Account" to enter.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleLoginSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    if (isSignUp) {
      const result = signUpUser(formData.name, formData.email, formData.password);
      if (result.success && result.user) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('library_active_session', 'true');
        }
        setStatusMessage(`Account created! Welcome, ${result.user.name}!`);
        setCurrentUser(result.user);
        setTimeout(() => setStatusMessage(null), 3000);
      } else {
        setAuthError(result.error || 'Failed to create account.');
      }
      setAuthLoading(false);
    } else {
      const result = signInUser(formData.email, formData.password);
      if (result.success && result.user) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('library_active_session', 'true');
        }
        setStatusMessage(`Welcome back, ${result.user.name}! Opening library...`);
        setCurrentUser(result.user);
        setTimeout(() => setStatusMessage(null), 3000);
      } else {
        setAuthError(result.error || 'Invalid credentials.');
      }
      setAuthLoading(false);
    }
  };

  const handleShelfToggle = async (bookId: string) => {
    const isCurrentlySaved = savedBooks.includes(bookId);
    const newStatus = isCurrentlySaved ? 'remove' : 'want_to_read';

    // Optimistic UI update
    setSavedBooks((prev) =>
      isCurrentlySaved ? prev.filter((id) => id !== bookId) : [...prev, bookId]
    );

    setStatusMessage(
      isCurrentlySaved
        ? 'Book removed from your private shelf'
        : 'Book added to your "Want to Read" shelf'
    );
    setTimeout(() => setStatusMessage(null), 3000);

    try {
      const res = await fetch('/api/shelves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: bookId, status: newStatus }),
      });

      if (res.ok) {
        const data = await res.json();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('shelf-updated', { detail: { count: data.totalShelved } })
          );
        }
      } else {
        // Revert on failure
        setSavedBooks((prev) =>
          isCurrentlySaved ? [...prev, bookId] : prev.filter((id) => id !== bookId)
        );
      }
    } catch (err) {
      console.error('Error toggling shelf item:', err);
      // Revert on network failure
      setSavedBooks((prev) =>
        isCurrentlySaved ? [...prev, bookId] : prev.filter((id) => id !== bookId)
      );
    }
  };

  // SSR loading skeleton
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white px-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 mb-4 animate-pulse">
          <Lock className="h-6 w-6" />
        </div>
        <p className="text-sm font-medium text-neutral-300">Opening library portal...</p>
      </div>
    );
  }

  // =========================================================================
  // 1. FIRST SCREEN: LOGIN SECTION (Opens with login section if not signed in)
  // =========================================================================
  if (!currentUser) {
    const signInFields = {
      header: 'Sign In to Library',
      subHeader: 'Access your private reading shelves, bookmarks, and public-domain catalog.',
      errorField: authError || undefined,
      fields: [
        {
          id: 'email',
          label: 'Email Address',
          required: true,
          placeholder: 'reader@library.community',
          type: 'email' as const,
          value: formData.email,
          onChange: handleInputChange('email'),
        },
        {
          id: 'password',
          label: 'Password',
          required: true,
          placeholder: '••••••••',
          type: 'password' as const,
          value: formData.password,
          onChange: handleInputChange('password'),
        },
      ],
      submitButton: authLoading ? 'Signing In...' : 'Sign In to Account',
      textVariantButton: "Don't have an account? Create Free Account",
    };

    const signUpFields = {
      header: 'Create Free Account',
      subHeader: 'Join the community library. 100% free, private shelves, zero tracking.',
      errorField: authError || undefined,
      fields: [
        {
          id: 'name',
          label: 'Display Name / Nickname',
          required: true,
          placeholder: 'e.g. Elizabeth Bennet',
          type: 'text' as const,
          value: formData.name,
          onChange: handleInputChange('name'),
        },
        {
          id: 'email',
          label: 'Email Address',
          required: true,
          placeholder: 'reader@library.community',
          type: 'email' as const,
          value: formData.email,
          onChange: handleInputChange('email'),
        },
        {
          id: 'password',
          label: 'Password',
          required: true,
          placeholder: '•••••••• (min 6 characters)',
          type: 'password' as const,
          value: formData.password,
          onChange: handleInputChange('password'),
        },
      ],
      submitButton: authLoading ? 'Creating Account...' : 'Create Free Account',
      textVariantButton: 'Already have an account? Sign In',
    };

    return (
      <main className="relative min-h-screen w-full bg-neutral-950 overflow-hidden">
        {/* Floating Toast Notification */}
        {statusMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-neutral-900/95 px-4 py-3 text-sm text-teal-300 shadow-2xl backdrop-blur-md border border-teal-500/30 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Top Header */}
        <header className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <span className="font-serif text-base font-bold text-white tracking-wide">
                Open Classics
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-semibold text-teal-400 bg-teal-950/80 border border-teal-500/30 px-1.5 py-0.5 rounded">
                Member Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-neutral-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="hidden sm:inline">Tracker-Free · Private Reading Protection</span>
          </div>
        </header>

        {/* Auth Box & Background */}
        <AuthTabs
          formFields={isSignUp ? signUpFields : signInFields}
          handleSubmit={handleLoginSubmit}
          goTo={handleToggleMode}
        >
          {/* Quick 1-Click Demo Fill Card */}
          {!isSignUp && (
            <div className="rounded-xl border border-teal-500/30 bg-teal-950/40 p-3.5 text-left backdrop-blur-sm shadow-inner transition-all hover:border-teal-500/50 mt-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-teal-300">
                  <KeyRound className="h-3.5 w-3.5 text-amber-400" />
                  Dummy Test Account
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-teal-400/80 bg-teal-900/50 px-1.5 py-0.5 rounded border border-teal-500/20">
                  Instant Access
                </span>
              </div>
              <div className="mt-2 text-xs text-neutral-300 space-y-0.5 font-mono">
                <p>
                  <span className="text-neutral-500">Email:</span>{' '}
                  <span className="text-teal-200 select-all">{DUMMY_ACCOUNT.email}</span>
                </p>
                <p>
                  <span className="text-neutral-500">Password:</span>{' '}
                  <span className="text-teal-200 select-all">{DUMMY_ACCOUNT.password}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={handleAutoFillDemo}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 py-2 text-xs font-semibold text-teal-200 hover:text-white transition-all active:scale-98 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Auto-Fill Demo Credentials</span>
              </button>
            </div>
          )}
        </AuthTabs>
      </main>
    );
  }

  // =========================================================================
  // 2. MAIN SECTION: COMMUNITY LIBRARY (Shown after user logs in)
  // =========================================================================

  const displayedShelves =
    activeGenreFilter === 'all'
      ? ALL_GENRE_SHELVES
      : ALL_GENRE_SHELVES.filter((shelf) => shelf.slug === activeGenreFilter);

  const totalCatalogBooks = ALL_GENRE_SHELVES.reduce((acc, s) => acc + s.books.length, 0);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C1917] transition-colors selection:bg-teal-200">
      {/* Global Navigation Bar */}
      <Navbar savedCount={savedBooks.length} />

      {/* Floating Status Notification Toast */}
      {statusMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-3 text-sm text-teal-300 shadow-2xl backdrop-blur-md border border-teal-500/30 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Hero Section: 3D Coverflow Rack Carousel */}
      <section id="featured-hero" className="w-full bg-[#FAF7F2]">
        <CoverflowHero
          onBookShelfToggle={handleShelfToggle}
          savedBooks={savedBooks}
        />
      </section>

      {/* Stage B: Personalized RecSys Section Based on User Shelves */}
      <section className="w-full bg-[#FAF7F2]">
        <PersonalizedRecommendationsSection
          savedBooks={savedBooks}
          onShelfToggle={handleShelfToggle}
        />
      </section>

      {/* Genre Exploration Banner & Pills Bar */}
      <div className="sticky top-0 z-30 border-y border-[#E5DDD0] bg-[#FAF7F2]/95 backdrop-blur-md px-4 py-3 shadow-xs">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-700/10 text-teal-800 border border-teal-700/20 text-xs">
                <Compass className="h-3.5 w-3.5" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-stone-800">
                Browse By Literary Genre
              </span>
              <span className="rounded-full bg-teal-700/10 px-2.5 py-0.5 text-[11px] font-semibold text-teal-800 border border-teal-700/20">
                {totalCatalogBooks} Curated Volumes
              </span>
            </div>

            <div className="hidden md:flex items-center gap-2 text-xs text-stone-600 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>50 Landmark Works per Genre · Arranged & Verified</span>
            </div>
          </div>

          {/* Horizontally scrollable genre filter pills */}
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setActiveGenreFilter('all')}
              className={`flex-none rounded-lg px-3 py-1.5 font-medium transition-all ${
                activeGenreFilter === 'all'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'bg-[#EFE9DF] text-stone-700 hover:bg-[#E4DDD0] hover:text-stone-900 border border-[#DDD5C7]'
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
                    ? 'bg-teal-700 text-white shadow-sm'
                    : 'bg-[#EFE9DF] text-stone-700 hover:bg-[#E4DDD0] hover:text-stone-900 border border-[#DDD5C7]'
                }`}
              >
                {shelf.badge} ({shelf.books.length})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Community Content Shelves Arranged by Genre */}
      <main id="shelves" className="w-full bg-[#FAF7F2] pb-20">
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
      <footer className="w-full border-t border-[#E5DDD0] bg-[#F1EAE0] py-12 text-stone-600">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-700/10 text-teal-800 border border-teal-700/20">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="font-serif text-base font-bold text-stone-900">
                Open Classics Community Library
              </p>
              <p className="text-xs text-stone-500">
                500 public domain volumes curated and arranged across 10 literary genres. 100% tracker-free.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-stone-600">
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <ShieldCheck className="h-3.5 w-3.5" />
              Surveillance-Free Catalog
            </span>
            <span>·</span>
            <span>Project Gutenberg &amp; Open Library Public Domain</span>
            <span>·</span>
            <span className="text-stone-600">
              Signed in as <strong className="text-teal-800">{currentUser?.name}</strong>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
