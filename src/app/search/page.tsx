"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  ArrowLeft,
  Bookmark,
  Check,
  Filter,
  BookOpen,
  Sparkles,
  X,
  Compass,
  ArrowRight,
  Layers,
} from "lucide-react";
import { SearchResultBook } from "@/lib/catalog/search";
import { SimilarBookMatch } from "@/lib/recommend/engine";

const AUDIENCE_FILTERS = [
  { label: "All Ages", value: "all" },
  { label: "Children", value: "children" },
  { label: "Teens", value: "teen" },
  { label: "Adults", value: "adult" },
];

const SUBJECT_FILTERS = [
  "All Subjects",
  "Mystery & Crime",
  "Science Fiction",
  "Philosophy & Ethics",
  "Adventure",
  "Gothic & Horror",
  "Romance & Society",
  "History & Life",
  "Children's & YA",
  "Poetry & Epics",
  "Wit & Satire",
];

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get("q") || "";
  const initialAudience = searchParams.get("audience") || "all";
  const initialSubject = searchParams.get("subject") || "All Subjects";

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [audience, setAudience] = useState(initialAudience);
  const [subject, setSubject] = useState(initialSubject);
  const [books, setBooks] = useState<SearchResultBook[]>([]);
  const [recommendations, setRecommendations] = useState<SimilarBookMatch[]>([]);
  const [total, setTotal] = useState(0);
  const [tookMs, setTookMs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savedBooks, setSavedBooks] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Debounce typing input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 180);
    return () => clearTimeout(handler);
  }, [query]);

  // Fetch search results and recommendations
  useEffect(() => {
    let isCurrent = true;
    setLoading(true);

    const params = new URLSearchParams();
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (audience && audience !== "all") params.set("audience", audience);
    if (subject && subject !== "All Subjects") params.set("subject", subject);

    fetch(`/api/search?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isCurrent) return;
        setBooks(data.books || []);
        setRecommendations(data.recommendations || []);
        setTotal(data.total || 0);
        setTookMs(data.tookMs || 0);
        setLoading(false);
      })
      .catch((err) => {
        if (!isCurrent) return;
        console.error("Search fetch error:", err);
        setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [debouncedQuery, audience, subject]);

  const handleShelfToggle = async (bookSlug: string, bookTitle: string) => {
    const isSaved = savedBooks.includes(bookSlug);
    const newSaved = isSaved
      ? savedBooks.filter((s) => s !== bookSlug)
      : [...savedBooks, bookSlug];

    setSavedBooks(newSaved);

    try {
      await fetch("/api/shelves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workSlug: bookSlug,
          status: isSaved ? "remove" : "want_to_read",
        }),
      });

      setToastMessage(
        isSaved
          ? `Removed "${bookTitle}" from your shelves`
          : `Added "${bookTitle}" to your Want to Read shelf`
      );
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error("Shelf update error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[var(--paper)]/90 border-b border-[var(--line)] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--shelf-teal)] transition-colors group flex-none"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="hidden sm:inline">Back to Library</span>
          </Link>

          {/* Search input in header */}
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search 500 classics, authors, themes (e.g. Sherlock, Dracula, Space)..."
              className="w-full h-10 pl-10 pr-9 rounded-xl bg-[var(--surface)] border border-[var(--line)] text-sm text-[var(--ink)] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[var(--shelf-teal)]/40 transition-all shadow-sm"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-0.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="text-xs font-semibold text-[var(--shelf-teal)] uppercase tracking-wider hidden md:block flex-none">
            {loading ? "Searching 500 books..." : `${total} books found (${tookMs}ms)`}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--line)] mb-8">
          {/* Audience Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mr-1">
              Audience:
            </span>
            {AUDIENCE_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setAudience(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  audience === f.value
                    ? "bg-[var(--shelf-teal)] text-white shadow-sm"
                    : "bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] hover:bg-neutral-100 dark:hover:bg-zinc-800"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Subject Dropdown / Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mr-1">
              Genre:
            </span>
            {SUBJECT_FILTERS.map((subj) => (
              <button
                key={subj}
                onClick={() => setSubject(subj)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  subject === subj
                    ? "bg-[var(--bookmark-amber)] text-white font-semibold shadow-sm"
                    : "bg-[var(--surface)] border border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                {subj}
              </button>
            ))}
          </div>
        </div>

        {/* Floating Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-neutral-900/95 px-4 py-3 text-sm text-teal-300 shadow-2xl backdrop-blur-md border border-teal-500/30 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Results Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="aspect-[2/3] rounded-2xl bg-[var(--surface)] border border-[var(--line)] animate-pulse"
              />
            ))}
          </div>
        ) : books.length === 0 ? (
          /* Empty Search State with Smart Recommendations */
          <div className="py-12 flex flex-col items-center">
            <div className="text-center max-w-lg mb-10">
              <BookOpen className="w-12 h-12 text-[var(--muted)] mx-auto mb-4 stroke-[1.5]" />
              <h3 className="font-serif text-2xl font-bold mb-2">No exact match for &quot;{query}&quot;</h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                We couldn&apos;t find an exact title matching that query with current filters. Here are recommended landmark classics from our curated collection:
              </p>
              <button
                onClick={() => {
                  setQuery("");
                  setAudience("all");
                  setSubject("All Subjects");
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-[var(--shelf-teal)] text-white text-xs font-semibold hover:brightness-110 shadow-sm cursor-pointer"
              >
                Clear Filters & Show All Books
              </button>
            </div>

            {/* Recommendations Grid for Empty Search */}
            {recommendations.length > 0 && (
              <div className="w-full">
                <div className="flex items-center gap-2 text-xs font-bold text-[var(--shelf-teal)] uppercase tracking-wider mb-4">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Curated Recommended Volumes</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {recommendations.map((reco) => (
                    <div
                      key={reco.slug}
                      className="group relative flex flex-col rounded-2xl bg-[var(--surface)] border border-[var(--line)] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
                    >
                      <Link href={`/book/${reco.slug}`} className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-900 block">
                        <img
                          src={reco.coverUrl}
                          alt={reco.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute top-2 right-2 bg-neutral-950/90 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                          {reco.matchPercentage}% Match
                        </div>
                        <div className="absolute bottom-2 left-2 bg-neutral-950/80 text-neutral-300 text-[9px] font-medium px-1.5 py-0.5 rounded">
                          {reco.genreBadge}
                        </div>
                      </Link>

                      <div className="p-3.5 flex flex-col flex-1 justify-between">
                        <div>
                          <Link
                            href={`/book/${reco.slug}`}
                            className="font-serif font-bold text-sm text-[var(--ink)] hover:text-[var(--shelf-teal)] line-clamp-1 transition-colors"
                          >
                            {reco.title}
                          </Link>
                          <p className="text-xs text-[var(--muted)] line-clamp-1 mt-0.5">
                            {reco.authorName} · {reco.year}
                          </p>
                        </div>
                        <div className="mt-2.5 pt-2 border-t border-[var(--line)]/50">
                          <p className="text-[10px] text-[var(--shelf-teal)] line-clamp-2">
                            {reco.reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Active Results State */
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {books.map((book) => {
                const isSaved = savedBooks.includes(book.slug);
                return (
                  <div
                    key={book.id}
                    className="group relative flex flex-col rounded-2xl bg-[var(--surface)] border border-[var(--line)] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
                  >
                    {/* Cover */}
                    <Link
                      href={`/book/${book.slug}`}
                      className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-900 block"
                    >
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute top-2 right-2 bg-neutral-900/80 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {book.audienceLevel}
                      </div>
                      <div className="absolute bottom-2 left-2 bg-neutral-950/80 text-neutral-300 text-[9px] font-medium px-1.5 py-0.5 rounded">
                        {book.genreBadge}
                      </div>
                    </Link>

                    {/* Book Details */}
                    <div className="p-3.5 flex flex-col flex-1 justify-between">
                      <div>
                        <Link
                          href={`/book/${book.slug}`}
                          className="font-serif font-bold text-sm text-[var(--ink)] hover:text-[var(--shelf-teal)] line-clamp-1 transition-colors"
                        >
                          {book.title}
                        </Link>
                        <p className="text-xs text-[var(--muted)] line-clamp-1 mt-0.5">
                          {book.authorName} · {book.firstPublishYear || "Classic"}
                        </p>
                      </div>

                      {/* Shelf Action */}
                      <button
                        onClick={() => handleShelfToggle(book.slug, book.title)}
                        className={`mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isSaved
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                            : "bg-[var(--paper)] text-[var(--ink)] border border-[var(--line)] hover:bg-[var(--shelf-teal)] hover:text-white hover:border-transparent"
                        }`}
                      >
                        {isSaved ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Shelved</span>
                          </>
                        ) : (
                          <>
                            <Bookmark className="w-3.5 h-3.5" />
                            <span>Want to Read</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Smart Recommendations Below Results */}
            {recommendations.length > 0 && (
              <section className="mt-16 pt-10 border-t border-[var(--line)]">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--shelf-teal)] uppercase tracking-wider mb-1">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Recommended Related Classics</span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-serif font-bold text-[var(--ink)]">
                      You Might Also Enjoy
                    </h2>
                    <p className="text-xs text-[var(--muted)] mt-0.5">
                      Matched by genre and thematic affinity to your search results
                    </p>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs text-[var(--muted)] bg-[var(--surface)] px-3 py-1 rounded-full border border-[var(--line)]">
                    <Layers className="w-3.5 h-3.5 text-[var(--shelf-teal)]" />
                    <span>Content RecSys</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {recommendations.slice(0, 6).map((reco) => (
                    <div
                      key={reco.slug}
                      className="group relative flex flex-col rounded-2xl bg-[var(--surface)] border border-[var(--line)] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
                    >
                      <Link href={`/book/${reco.slug}`} className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-900 block">
                        <img
                          src={reco.coverUrl}
                          alt={reco.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute top-2 right-2 bg-neutral-950/90 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                          {reco.matchPercentage}% Match
                        </div>
                        <div className="absolute bottom-2 left-2 bg-neutral-950/80 text-neutral-300 text-[9px] font-medium px-1.5 py-0.5 rounded">
                          {reco.genreBadge}
                        </div>
                      </Link>

                      <div className="p-3.5 flex flex-col flex-1 justify-between">
                        <div>
                          <Link
                            href={`/book/${reco.slug}`}
                            className="font-serif font-bold text-sm text-[var(--ink)] hover:text-[var(--shelf-teal)] line-clamp-1 transition-colors"
                          >
                            {reco.title}
                          </Link>
                          <p className="text-xs text-[var(--muted)] line-clamp-1 mt-0.5">
                            {reco.authorName} · {reco.year}
                          </p>
                        </div>
                        <div className="mt-2.5 pt-2 border-t border-[var(--line)]/50">
                          <p className="text-[10px] text-[var(--shelf-teal)] line-clamp-2">
                            {reco.reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--paper)] flex items-center justify-center">Loading search catalog...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
