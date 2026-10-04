'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Bookmark, Check, Compass, Info, ArrowRight, ShieldCheck, Flame } from 'lucide-react';
import { SimilarBookMatch, RecommendationResponse } from '@/lib/recommend/engine';

interface PersonalizedRecommendationsSectionProps {
  savedBooks: string[];
  onShelfToggle: (bookId: string) => void;
}

export default function PersonalizedRecommendationsSection({
  savedBooks,
  onShelfToggle,
}: PersonalizedRecommendationsSectionProps) {
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    async function fetchRecos() {
      setLoading(true);
      try {
        const res = await fetch('/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shelvedSlugs: savedBooks,
            limit: 6,
          }),
        });
        if (res.ok) {
          const json: RecommendationResponse = await res.json();
          if (!isCancelled) {
            setData(json);
          }
        }
      } catch (err) {
        console.error('Failed to load personalized recommendations:', err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    fetchRecos();

    return () => {
      isCancelled = true;
    };
  }, [savedBooks]);

  if (loading && !data) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-8">
        <div className="h-64 rounded-2xl bg-neutral-900/40 border border-white/5 animate-pulse flex items-center justify-center text-neutral-500 text-sm">
          Computing personalized taste recommendations...
        </div>
      </div>
    );
  }

  if (!data || data.recommendations.length === 0) return null;

  return (
    <section className="relative mx-auto max-w-[1400px] px-4 py-8">
      {/* Background Subtle Warm Tint */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-200/15 via-teal-200/10 to-stone-200/15 rounded-3xl -z-10 blur-xl pointer-events-none" />

      {/* Header Container */}
      <div className="rounded-2xl border border-[#E5DDD0] bg-white/95 backdrop-blur-xl p-6 md:p-8 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-700/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal-800 border border-teal-700/20">
                <Sparkles className="h-3.5 w-3.5" />
                {data.isColdStart ? 'Curated Taste Foundations' : 'Dynamic Taste Profile'}
              </span>

              {!data.isColdStart && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-700/10 px-2.5 py-0.5 text-xs font-medium text-emerald-800 border border-emerald-700/20">
                  <Check className="h-3 w-3" />
                  {savedBooks.length} Books on Shelf
                </span>
              )}
            </div>

            <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 tracking-tight">
              {data.isColdStart ? 'Recommended For You · Curator Highlights' : 'Recommended For You · Tailored Selections'}
            </h2>

            <p className="mt-1 text-sm text-stone-600 max-w-2xl leading-relaxed flex items-start gap-1.5">
              <Info className="h-4 w-4 text-teal-700 flex-none mt-0.5" />
              <span>{data.explanationNote}</span>
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-1 text-xs text-stone-500">
            <span className="font-semibold text-stone-700">Recommender Transparency</span>
            <span className="text-[11px] text-stone-500">
              No private trackers · Local vector &amp; subject affinity
            </span>
          </div>
        </div>

        {/* Recommended Books Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 mt-6">
          {data.recommendations.map((book) => {
            const isSaved = savedBooks.includes(book.slug);

            return (
              <div
                key={book.slug}
                className="group relative flex flex-col justify-between rounded-xl bg-[#FAF7F2] border border-[#E5DDD0] hover:border-teal-600 p-3 shadow-xs hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Book Cover */}
                <Link href={`/book/${book.slug}`} className="block relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-stone-100 mb-3 shadow-xs">
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Match Percentage Badge */}
                  <div className="absolute top-2 right-2 bg-white/95 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-600/30 backdrop-blur-xs shadow-xs">
                    {book.matchPercentage}% Match
                  </div>

                  {/* Genre Tag */}
                  <div className="absolute bottom-2 left-2 bg-white/95 text-stone-700 text-[9px] font-medium px-1.5 py-0.5 rounded border border-stone-200 backdrop-blur-xs">
                    {book.genreBadge}
                  </div>
                </Link>

                {/* Book Meta */}
                <div className="flex flex-col flex-1 justify-between">
                  <div>
                    <Link
                      href={`/book/${book.slug}`}
                      className="font-serif font-bold text-sm text-stone-900 hover:text-teal-700 line-clamp-1 transition-colors"
                    >
                      {book.title}
                    </Link>
                    <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">
                      {book.authorName}
                    </p>
                  </div>

                  {/* Reason Pill */}
                  <div className="mt-2.5 pt-2 border-t border-[#EAE3D6]">
                    <p className="text-[10px] font-medium text-teal-800 line-clamp-2 leading-tight">
                      {book.reason}
                    </p>
                  </div>

                  {/* Shelf Action Button */}
                  <button
                    onClick={() => onShelfToggle(book.slug)}
                    className={`mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isSaved
                        ? 'bg-emerald-700/15 text-emerald-800 border border-emerald-700/30 hover:bg-emerald-700/25'
                        : 'bg-[#EFE9DF] text-stone-800 border border-[#DDD5C7] hover:bg-teal-700 hover:text-white'
                    }`}
                  >
                    {isSaved ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-700" />
                        <span>Shelved</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="h-3.5 w-3.5" />
                        <span>Want to Read</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
