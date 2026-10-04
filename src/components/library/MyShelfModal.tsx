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
    <div className="fixed inset-0 z-[9999] isolate flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[10000] flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-3 text-sm text-teal-300 shadow-2xl border border-teal-500/30 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Sparkles className="h-4 w-4 text-amber-400 flex-none" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="relative z-10 flex flex-col w-full max-w-4xl max-h-[90vh] rounded-3xl border border-[#E5DDD0] bg-[#FAF7F2] text-[#1C1917] shadow-2xl overflow-hidden backdrop-blur-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E5DDD0] bg-white/95 flex-none">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700/10 text-teal-800 border border-teal-700/20">
              <Bookmark className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-xl font-bold tracking-tight text-stone-900">
                  My Private Reading Shelves
                </h2>
                <span className="rounded-full bg-teal-700/10 px-2.5 py-0.5 text-[11px] font-semibold text-teal-800 border border-teal-700/20">
                  {counts.all} Books
                </span>
              </div>
              <p className="text-xs text-stone-600 mt-0.5">
                Private to your session · Powers your personal recommendation engine
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Shelf Tabs */}
        <div className="flex items-center gap-1.5 px-6 py-3 border-b border-[#E5DDD0] bg-[#F5EFE6] overflow-x-auto no-scrollbar text-xs flex-none">
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
                  ? 'bg-teal-700 text-white font-bold shadow-xs'
                  : 'bg-white text-stone-700 hover:bg-[#FAF7F2] hover:text-stone-900 border border-[#E5DDD0]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.id
                    ? 'bg-teal-900 text-teal-100'
                    : 'bg-stone-100 text-stone-600'
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
                  className="h-24 rounded-xl bg-stone-200/50 border border-[#E5DDD0] animate-pulse"
                />
              ))}
            </div>
          ) : displayedBooks.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center">
              <BookOpen className="h-12 w-12 text-stone-400 mb-3" />
              <h3 className="font-serif text-lg font-bold text-stone-800">
                No books in this shelf yet
              </h3>
              <p className="text-xs text-stone-600 max-w-sm mt-1">
                Explore our catalog of 500 landmark classics across 10 genres and click &quot;Want to Read&quot; to build your personal library!
              </p>
              <button
                onClick={onClose}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 shadow-md transition-all cursor-pointer"
              >
                <span>Browse Catalog Shelves</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#E5DDD0]">
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
                      className="relative h-20 w-14 rounded-lg overflow-hidden flex-none bg-stone-100 border border-[#E5DDD0] group-hover:border-teal-600 shadow-xs"
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
                          className="font-serif font-bold text-sm text-stone-900 hover:text-teal-700 transition-colors truncate block"
                        >
                          {item.title}
                        </Link>
                        <span className="hidden sm:inline-block text-[10px] font-semibold text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200">
                          {item.genreBadge}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 truncate mt-0.5">
                        {item.authorName}
                      </p>

                      {/* Interactive 5-Star Rating */}
                      <div className="flex items-center gap-1 mt-2">
                        <span className="text-[10px] text-stone-500 mr-1">Rating:</span>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => handleUpdateRating(item.slug, star)}
                            className="p-0.5 text-stone-300 hover:text-amber-500 transition-colors cursor-pointer"
                            title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                          >
                            <Star
                              className={`h-3.5 w-3.5 ${
                                item.rating && item.rating >= star
                                  ? 'fill-amber-500 text-amber-500'
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
                        className={`text-xs font-semibold py-1.5 px-3 rounded-lg border appearance-none pr-7 cursor-pointer focus:outline-none focus:ring-1 focus:ring-teal-600 ${getStatusStyle(
                          item.status
                        )}`}
                      >
                        <option value="want_to_read">Want to Read</option>
                        <option value="reading">Currently Reading</option>
                        <option value="read">Finished / Read</option>
                        <option value="did_not_finish">Did Not Finish</option>
                      </select>
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-stone-500 text-[10px]">
                        ▼
                      </span>
                    </div>

                    {/* View Details Link */}
                    <Link
                      href={`/book/${item.slug}`}
                      onClick={onClose}
                      className="p-1.5 rounded-lg text-stone-500 hover:text-teal-700 hover:bg-stone-100 border border-transparent hover:border-[#E5DDD0] transition-colors"
                      title="View book detail"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>

                    {/* 1-Click Remove Button */}
                    <button
                      onClick={() => handleRemoveBook(item.slug, item.title)}
                      className="inline-flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-medium text-red-700 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 transition-all cursor-pointer"
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
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#E5DDD0] bg-white/95 text-xs text-stone-600 flex-none">
          <span className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-teal-700" />
            <span>Shelved books actively refine your personalized recommendations</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold border border-[#E5DDD0] transition-colors cursor-pointer"
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
      return 'border-teal-600/40 text-teal-800 bg-teal-50';
    case 'reading':
      return 'border-amber-600/40 text-amber-800 bg-amber-50';
    case 'read':
      return 'border-emerald-600/40 text-emerald-800 bg-emerald-50';
    case 'did_not_finish':
      return 'border-red-400 text-red-700 bg-red-50';
    default:
      return 'border-[#E5DDD0] text-stone-800 bg-white';
  }
}
