'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Search, User, Bookmark, LogOut, CheckCircle2 } from 'lucide-react';
import { checkIsAuthenticated, getCurrentUser, logoutUser, UserProfile } from '@/lib/auth';

interface NavbarProps {
  onOpenAuth?: () => void;
  savedCount: number;
}

export function Navbar({ onOpenAuth, savedCount }: NavbarProps) {
  const router = useRouter();
  const [navQuery, setNavQuery] = useState('');
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (checkIsAuthenticated()) {
      setUser(getCurrentUser());
    } else {
      setUser(null);
    }
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (navQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(navQuery.trim())}`);
    } else {
      router.push('/search');
    }
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-neutral-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
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

        {/* Search Input (Center) */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              value={navQuery}
              onChange={(e) => setNavQuery(e.target.value)}
              placeholder="Search books, authors, philosophy, romance..."
              className="w-full h-9 pl-9 pr-4 rounded-lg bg-neutral-900 border border-white/10 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-teal-400/50 transition-all"
            />
          </div>
        </form>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Shelves indicator */}
          <div className="flex items-center gap-1.5 text-xs text-neutral-300 px-3 py-1.5 rounded-lg border border-white/10 bg-neutral-900/60">
            <Bookmark className="h-3.5 w-3.5 text-teal-400" />
            <span className="hidden sm:inline">My Shelf:</span>
            <span className="font-semibold text-white">{savedCount}</span>
          </div>

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
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-teal-500 to-indigo-600 px-3.5 py-1.5 text-xs sm:text-sm font-medium text-white shadow-md hover:brightness-110 active:scale-95 transition-all"
            >
              <User className="h-4 w-4" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
