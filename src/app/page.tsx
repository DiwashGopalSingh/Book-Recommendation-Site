'use client';

import { useState, useEffect } from 'react';
import { AuthTabs } from '@/components/LoginForm';
import { Navbar } from '@/components/Navbar';
import { CoverflowHero } from '@/components/CoverflowHero';
import { ShelfSection, SAMPLE_SHELVES_DATA, BookItem } from '@/components/BookShelfCarousel';
import {
  checkIsAuthenticated,
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
  KeyRound,
  Lock,
} from 'lucide-react';

interface GenreShelf {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  books: BookItem[];
}

export default function CommunityLibraryPage() {
  const [isClient, setIsClient] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Dynamic genre shelves housing all 500 books
  const [genreShelves, setGenreShelves] = useState<GenreShelf[]>([]);
  const [loadingShelves, setLoadingShelves] = useState(false);

  // Login form state
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Library shelves state
  const [savedBooks, setSavedBooks] = useState<string[]>([
    'the_odyssey',
    'meditations',
    'pride_and_prejudice',
  ]);

  useEffect(() => {
    setIsClient(true);
    if (checkIsAuthenticated()) {
      setIsAuthenticated(true);
      setCurrentUser(getCurrentUser());
    }

    // Load full collection organized into their respective genres
    setLoadingShelves(true);
    fetch('/api/genres')
      .then((res) => res.json())
      .then((data) => {
        if (data.shelves && Array.isArray(data.shelves)) {
          setGenreShelves(data.shelves);
        }
        setLoadingShelves(false);
      })
      .catch((err) => {
        console.error('Failed to load genre shelves:', err);
        setLoadingShelves(false);
      });
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
    setToastMessage('Demo credentials filled! Click "Sign In" to enter.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleLoginSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);

    if (isSignUp) {
      const result = signUpUser(formData.name, formData.email, formData.password);
      if (result.success && result.user) {
        setToastMessage(`Account created! Welcome, ${result.user.name}!`);
        setCurrentUser(result.user);
        setIsAuthenticated(true);
      } else {
        setAuthError(result.error || 'Failed to create account.');
      }
      setLoading(false);
    } else {
      const result = signInUser(formData.email, formData.password);
      if (result.success && result.user) {
        setToastMessage(`Welcome back, ${result.user.name}!`);
        setCurrentUser(result.user);
        setIsAuthenticated(true);
      } else {
        setAuthError(result.error || 'Invalid credentials.');
      }
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setFormData({ name: '', email: '', password: '' });
    setToastMessage('Signed out successfully.');
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleShelfToggle = (bookId: string) => {
    setSavedBooks((prev) => {
      const exists = prev.includes(bookId);
      const updated = exists ? prev.filter((id) => id !== bookId) : [...prev, bookId];
      setToastMessage(
        exists
          ? 'Book removed from your private shelf'
          : 'Book added to your "Want to Read" shelf'
      );
      setTimeout(() => setToastMessage(null), 3000);
      return updated;
    });
  };

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
    submitButton: loading ? 'Signing In...' : 'Sign In to Account',
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
    submitButton: loading ? 'Creating Account...' : 'Create Free Account',
    textVariantButton: 'Already have an account? Sign In',
  };

  // Initial SSR state placeholder
  if (!isClient) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-neutral-400">
        <Lock className="h-6 w-6 animate-pulse text-teal-400" />
      </div>
    );
  }

  // =========================================================================
  // 1. FIRST SCREEN: LOGIN PAGE (Shown when user is unauthenticated)
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <main className="relative min-h-screen w-full bg-neutral-950 overflow-hidden">
        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-neutral-900/95 px-4 py-3 text-sm text-teal-300 shadow-2xl backdrop-blur-md border border-teal-500/30 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>{toastMessage}</span>
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
            <div className="rounded-xl border border-teal-500/30 bg-teal-950/30 p-3.5 text-left backdrop-blur-sm shadow-inner transition-all hover:border-teal-500/50">
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
  // 2. MAIN CONTENT: COMMUNITY LIBRARY (Shown after user logs in)
  // =========================================================================
  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] transition-colors">
      {/* Global Navbar with user identity & sign out */}
      <Navbar
        user={currentUser}
        onLogout={handleLogout}
        savedCount={savedBooks.length}
      />

      {/* Floating Status Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-neutral-900/95 px-4 py-3 text-sm text-teal-300 shadow-2xl backdrop-blur-md border border-teal-500/30 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Featured Books Coverflow Hero Section */}
      <section id="featured-hero" className="w-full">
        <CoverflowHero onBookShelfToggle={handleShelfToggle} savedBooks={savedBooks} />
      </section>

      {/* Categorized Shelves Carousel Section */}
      <main id="shelves" className="w-full bg-neutral-950 pb-16">
        {/* Quick Genre Jump Bar */}
        <div className="sticky top-16 z-30 bg-neutral-950/95 backdrop-blur-md border-b border-white/10 py-3 shadow-md">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-400 mr-1 flex items-center gap-1.5 shrink-0">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              Genres:
            </span>
            <a
              href="#shelf-staff"
              className="text-xs px-3 py-1.5 rounded-full bg-neutral-900 border border-white/10 text-neutral-300 hover:text-white hover:border-teal-500/40 shrink-0 transition-all font-medium"
            >
              Curated Classics
            </a>
            {genreShelves.map((shelf) => (
              <a
                key={shelf.id}
                href={`#shelf-${shelf.id}`}
                className="text-xs px-3 py-1.5 rounded-full bg-neutral-900 border border-white/10 text-neutral-300 hover:text-white hover:border-teal-500/40 shrink-0 transition-all font-medium"
              >
                {shelf.badge} ({shelf.books.length})
              </a>
            ))}
          </div>
        </div>

        {/* 1. Curated Staff Picks */}
        <div id="shelf-staff">
          <ShelfSection
            title="Curated Staff Picks & Foundational Classics"
            subtitle="Curated foundational works of enduring philosophical depth and narrative mastery"
            books={SAMPLE_SHELVES_DATA.staffPicks}
            onBookShelfToggle={handleShelfToggle}
            savedBooks={savedBooks}
          />
        </div>

        {/* 2. All Ingested Books Distributed In Respective Genre Shelves */}
        {genreShelves.length > 0 ? (
          genreShelves.map((shelf) => (
            <div key={shelf.id} id={`shelf-${shelf.id}`}>
              <ShelfSection
                title={shelf.title}
                subtitle={shelf.subtitle}
                books={shelf.books}
                onBookShelfToggle={handleShelfToggle}
                savedBooks={savedBooks}
              />
            </div>
          ))
        ) : (
          <>
            <ShelfSection
              title="Timeless Philosophy & Wisdom"
              subtitle="Moral reflections, Stoic fortitude, and classical inquiry across the ages"
              books={SAMPLE_SHELVES_DATA.philosophy}
              onBookShelfToggle={handleShelfToggle}
              savedBooks={savedBooks}
            />
            <ShelfSection
              title="Wit, Satire & Epic Adventure"
              subtitle="Sparkling dialogues, imaginative odysseys, and biting social commentary"
              books={SAMPLE_SHELVES_DATA.comedyAndAdventure}
              onBookShelfToggle={handleShelfToggle}
              savedBooks={savedBooks}
            />
            <ShelfSection
              title="World Classics & Monumental Sagas"
              subtitle="Sweeping historical dramas, gothic mysteries, and beloved coming-of-age masterworks"
              books={SAMPLE_SHELVES_DATA.worldClassics}
              onBookShelfToggle={handleShelfToggle}
              savedBooks={savedBooks}
            />
          </>
        )}
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
                A non-profit community reading initiative. 100% tracker-free.
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
            <span className="text-teal-400 font-medium">
              Signed in as {currentUser?.name || 'Member'}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
