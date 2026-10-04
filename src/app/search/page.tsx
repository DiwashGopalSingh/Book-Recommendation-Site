"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, ArrowLeft, Bookmark, Check, Filter, BookOpen, Star, Sparkles, X } from "lucide-react";
import { SearchResultBook } from "@/lib/catalog/search";

const AUDIENCE_FILTERS = [
  { label: "All Ages", value: "all" },
  { label: "Children", value: "children" },
  { label: "Teens", value: "teen" },
  { label: "Adults", value: "adult" },
];

const SUBJECT_FILTERS = [
  "All Subjects",
  "Classic Literature",
  "Philosophy & Ethics",
  "Gothic & Horror",
  "Satire & Adventure",
  "Ancient Classics",
];

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get("q") || "";
  const initialAudience = searchParams.get("audience") || "all";
  const initialSubject = searchParams.get("subject") || "All Subjects";

  const [query, setQuery] = useState(initialQuery);
  const [audience, setAudience] = useState(initialAudience);
  const [subject, setSubject] = useState(initialSubject);
  const [books, setBooks] = useState<SearchResultBook[]>([]);
  const [total, setTotal] = useState(0);
  const [tookMs, setTookMs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savedBooks, setSavedBooks] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch search results
  useEffect(() => {
    let isCurrent = true;
    setLoading(true);

    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (audience && audience !== "all") params.set("audience", audience);
    if (subject && subject !== "All Subjects") params.set("subject", subject);

    fetch(`/api/search?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isCurrent) return;
        setBooks(data.books || []);
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
  }, [query, audience, subject]);

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
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--shelf-teal)] transition-colors group"
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
              placeholder="Search by title, author, or philosophy..."
              className="w-full h-10 pl-10 pr-9 rounded-xl bg-[var(--surface)] border border-[var(--line)] text-sm text-[var(--ink)] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[var(--shelf-teal)]/30 transition-all shadow-sm"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="text-xs font-semibold text-[var(--shelf-teal)] uppercase tracking-wider hidden md:block">
            {loading ? "Searching..." : `${total} books found (${tookMs}ms)`}
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
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
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
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <BookOpen className="w-12 h-12 text-[var(--muted)] mb-4 stroke-[1.5]" />
            <h3 className="font-serif text-2xl font-bold mb-2">No matching books found</h3>
            <p className="text-sm text-[var(--muted)] max-w-md">
              We couldn't find any books matching &quot;{query}&quot; with the selected filters. Try broadening your keywords or clearing the genre filters.
            </p>
            <button
              onClick={() => {
                setQuery("");
                setAudience("all");
                setSubject("All Subjects");
              }}
              className="mt-6 px-4 py-2 rounded-xl bg-[var(--shelf-teal)] text-white text-xs font-semibold hover:brightness-110 shadow-sm"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
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
                    />

                    {/* Audience Badge */}
                    <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-teal-300 border border-teal-500/30">
                      {book.audienceLevel}
                    </span>

                    {/* Bookmark Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleShelfToggle(book.slug, book.title);
                      }}
                      className={`absolute top-2 right-2 z-20 p-1.5 rounded-full backdrop-blur-md shadow-md transition-all ${
                        isSaved
                          ? "bg-[var(--shelf-teal)] text-white"
                          : "bg-black/60 text-white/80 hover:bg-black/90 hover:text-white"
                      }`}
                      aria-label="Save to shelf"
                    >
                      {isSaved ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                    </button>
                  </Link>

                  {/* Info */}
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <Link href={`/book/${book.slug}`} className="block">
                        <h4 className="font-serif font-bold text-sm text-[var(--ink)] line-clamp-1 group-hover:text-[var(--shelf-teal)] transition-colors">
                          {book.title}
                        </h4>
                      </Link>
                      <p className="text-xs text-[var(--muted)] line-clamp-1 mt-0.5">
                        {book.authorName} · {book.firstPublishYear ? (book.firstPublishYear < 0 ? `${Math.abs(book.firstPublishYear)} BCE` : book.firstPublishYear) : "Classic"}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[var(--line)] flex items-center justify-between text-[11px] text-[var(--muted)]">
                      <span className="font-medium text-[var(--moss)]">
                        {book.pageCount} pages
                      </span>
                      <span className="capitalize text-[10px] bg-neutral-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[var(--muted)]">
                        {book.subjects[0] || "Classic"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center text-[var(--muted)]">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-[var(--shelf-teal)] animate-ping" />
            Loading catalog search...
          </div>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
