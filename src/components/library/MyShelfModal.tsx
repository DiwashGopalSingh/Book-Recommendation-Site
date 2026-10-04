'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bookmark,
  X,
  BookOpen,
  Check,
  Clock,
  Trash2,
  Star,
  ExternalLink,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { ShelvedBookItem } from '@/lib/catalog/shelfStore';

interface MyShelfModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShelfUpdated?: (totalCount: number) => void;
}

type ShelfFilterTab = 'all' | 'want_to_read' | 'reading' | 'read' | 'did_not_finish';

export default function MyShelfModal({
  isOpen,
  onClose,
  onShelfUpdated,
}: MyShelfModalProps) {
  const [shelvedBooks, setShelvedBooks] = useState<ShelvedBookItem[]>([]);
  const [activeTab, setActiveTab] = useState<ShelfFilterTab>('all');
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch shelves whenever modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isCurrent = true;
    setLoading(true);

    async function loadShelves() {
      try {
        const res = await fetch('/api/shelves');
        if (res.ok) {
          const data = await res.json();
          if (isCurrent) {
            setShelvedBooks(data.shelves || []);
            if (onShelfUpdated) onShelfUpdated(data.shelves?.length || 0);
          }
        }
      } catch (err) {
        console.error('Failed to load shelves:', err);
      } finally {
        if (isCurrent) setLoading(false);
      }
    }

    loadShelves();

    return () => {
      isCurrent = false;
    };
  }, [isOpen, onShelfUpdated]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleUpdateStatus = async (slug: string, newStatus: string) => {
    try {
      const res = await fetch('/api/shelves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setShelvedBooks((prev) =>
          prev.map((item) => (item.slug === slug ? data.item : item)).filter(Boolean)
        );
        if (onShelfUpdated) onShelfUpdated(data.totalShelved);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('shelf-updated', { detail: { count: data.totalShelved } }));
        }
        showToast(`Moved to ${formatStatusName(newStatus)}`);
      }
    } catch (err) {
      console.error('Failed to update shelf status:', err);
    }
  };

  const handleUpdateRating = async (slug: string, rating: number) => {
    const existing = shelvedBooks.find((b) => b.slug === slug);
    const newRating = existing?.rating === rating ? null : rating;

    try {
      const res = await fetch('/api/shelves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          status: existing?.status || 'read',
          rating: newRating,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setShelvedBooks((prev) =>
          prev.map((item) => (item.slug === slug ? data.item : item)).filter(Boolean)
        );
        if (onShelfUpdated) onShelfUpdated(data.totalShelved);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('shelf-updated', { detail: { count: data.totalShelved } }));
        }
        showToast(newRating ? `Rated ${newRating} stars` : 'Rating cleared');
      }
    } catch (err) {
      console.error('Failed to update rating:', err);
    }
  };

  const handleRemoveBook = async (slug: string, title: string) => {
    try {
      const res = await fetch('/api/shelves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, status: 'remove' }),
      });
      if (res.ok) {
        const data = await res.json();
        const updated = shelvedBooks.filter((b) => b.slug !== slug);
        setShelvedBooks(updated);
        if (onShelfUpdated) onShelfUpdated(data.totalShelved);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('shelf-updated', { detail: { count: data.totalShelved } }));
        }
        showToast(`Removed "${title}" from your shelf`);
      }
    } catch (err) {
      console.error('Failed to remove book from shelf:', err);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  if (!isOpen) return null;

  const counts = {
    all: shelvedBooks.length,
    want_to_read: shelvedBooks.filter((b) => b.status === 'want_to_read').length,
    reading: shelvedBooks.filter((b) => b.status === 'reading').length,
    read: shelvedBooks.filter((b) => b.status === 'read').length,
    did_not_finish: shelvedBooks.filter((b) => b.status === 'did_not_finish').length,
  };

  const displayedBooks =
    activeTab === 'all'
      ? shelvedBooks
      : shelvedBooks.filter((b) => b.status === activeTab);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-60 flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-3 text-sm text-teal-300 shadow-2xl border border-teal-500/30 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Sparkles className="h-4 w-4 text-amber-400 flex-none" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="relative flex flex-col w-full max-w-4xl max-h-[90vh] rounded-2xl border border-white/15 bg-neutral-950/95 text-white shadow-2xl overflow-hidden backdrop-blur-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
              <Bookmark className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg font-bold tracking-tight text-white">
                  My Private Reading Shelves
                </h2>
                <span className="rounded-full bg-teal-500/10 px-2 py-0.5 text-[11px] font-semibold text-teal-400 border border-teal-500/20">
                  {counts.all} Books
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Private to your session · Powers your personal recommendation engine
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Shelf Tabs */}
        <div className="flex items-center gap-1.5 px-6 py-3 border-b border-white/10 bg-neutral-900/30 overflow-x-auto no-scrollbar text-xs">
          {[
            { id: 'all', label: 'All Shelved', count: counts.all },
            { id: 'want_to_read', label: 'Want to Read', count: counts.want_to_read },
            { id: 'reading', label: 'Currently Reading', count: counts.reading },
            { id: 'read', label: 'Read & Finished', count: counts.read },
            { id: 'did_not_finish', label: 'Did Not Finish', count: counts.did_not_finish },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ShelfFilterTab)}
              className={`flex-none flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-teal-500 text-neutral-950 font-bold shadow-md shadow-teal-500/20'
                  : 'bg-neutral-900/80 text-neutral-300 hover:bg-neutral-800 hover:text-white border border-white/5'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.id
                    ? 'bg-teal-950 text-teal-200'
                    : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-24 rounded-xl bg-neutral-900/40 border border-white/5 animate-pulse"
                />
              ))}
            </div>
          ) : displayedBooks.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center">
              <BookOpen className="h-12 w-12 text-neutral-600 mb-3" />
              <h3 className="font-serif text-lg font-bold text-neutral-200">
                No books in this shelf yet
              </h3>
              <p className="text-xs text-neutral-400 max-w-sm mt-1">
                Explore our catalog of 500 landmark classics across 10 genres and click &quot;Want to Read&quot; to build your personal library!
              </p>
              <button
                onClick={onClose}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 text-neutral-950 text-xs font-bold hover:bg-teal-400 shadow-md transition-all cursor-pointer"
              >
                <span>Browse Catalog Shelves</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {displayedBooks.map((item) => (
                <div
                  key={item.slug}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 group"
                >
                  {/* Book Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <Link
                      href={`/book/${item.slug}`}
                      onClick={onClose}
                      className="relative h-20 w-14 rounded-lg overflow-hidden flex-none bg-neutral-900 border border-white/10 group-hover:border-teal-500/50 shadow"
                    >
                      <img
                        src={item.coverUrl}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                    </Link>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/book/${item.slug}`}
                          onClick={onClose}
                          className="font-serif font-bold text-sm text-neutral-100 hover:text-teal-300 transition-colors truncate block"
                        >
                          {item.title}
                        </Link>
                        <span className="hidden sm:inline-block text-[10px] font-semibold text-neutral-400 bg-neutral-900 px-1.5 py-0.5 rounded border border-white/5">
                          {item.genreBadge}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 truncate mt-0.5">
                        {item.authorName}
                      </p>

                      {/* Interactive 5-Star Rating */}
                      <div className="flex items-center gap-1 mt-2">
                        <span className="text-[10px] text-neutral-500 mr-1">Rating:</span>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => handleUpdateRating(item.slug, star)}
                            className="p-0.5 text-neutral-600 hover:text-amber-400 transition-colors cursor-pointer"
                            title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                          >
                            <Star
                              className={`h-3.5 w-3.5 ${
                                item.rating && item.rating >= star
                                  ? 'fill-amber-400 text-amber-400'
                                  : ''
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Status Pill */}
                  <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
                    {/* Status Changer Select */}
                    <div className="relative">
                      <select
                        value={item.status}
                        onChange={(e) => handleUpdateStatus(item.slug, e.target.value)}
                        className={`text-xs font-semibold py-1.5 px-3 rounded-lg border appearance-none pr-7 bg-neutral-900 cursor-pointer focus:outline-none focus:ring-1 focus:ring-teal-400 ${getStatusStyle(
                          item.status
                        )}`}
                      >
                        <option value="want_to_read">Want to Read</option>
                        <option value="reading">Currently Reading</option>
                        <option value="read">Finished / Read</option>
                        <option value="did_not_finish">Did Not Finish</option>
                      </select>
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 text-[10px]">
                        ▼
                      </span>
                    </div>

                    {/* View Details Link */}
                    <Link
                      href={`/book/${item.slug}`}
                      onClick={onClose}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-teal-300 hover:bg-neutral-900 border border-transparent hover:border-white/5 transition-colors"
                      title="View book detail"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>

                    {/* 1-Click Remove Button */}
                    <button
                      onClick={() => handleRemoveBook(item.slug, item.title)}
                      className="inline-flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-medium text-red-400 hover:text-white bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 transition-all cursor-pointer"
                      title="Remove from My Shelf"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="sm:hidden md:inline">Remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-white/10 bg-neutral-900/40 text-xs text-neutral-400">
          <span className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-teal-400" />
            <span>Shelved books actively refine your personalized recommendations</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-200 font-semibold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function formatStatusName(s: string): string {
  switch (s) {
    case 'want_to_read':
      return '"Want to Read"';
    case 'reading':
      return '"Currently Reading"';
    case 'read':
      return '"Read & Finished"';
    case 'did_not_finish':
      return '"Did Not Finish"';
    default:
      return s;
  }
}

function getStatusStyle(s: string): string {
  switch (s) {
    case 'want_to_read':
      return 'border-teal-500/40 text-teal-300';
    case 'reading':
      return 'border-amber-500/40 text-amber-300';
    case 'read':
      return 'border-emerald-500/40 text-emerald-300';
    case 'did_not_finish':
      return 'border-red-500/40 text-red-300';
    default:
      return 'border-white/10 text-neutral-300';
  }
}
