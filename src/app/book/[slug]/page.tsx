import { notFound } from "next/navigation";
import Link from "next/link";
import { getBookBySlug } from "@/lib/catalog/queries";
import { getSimilarBooks } from "@/lib/recommend/engine";
import { SimilarBooksSection } from "@/components/library";
import { BookOpen, Star, ArrowLeft, Bookmark, Check, ShieldCheck, Heart, ExternalLink, Calendar, Layers, Globe } from "lucide-react";
import BookDetailClientActions from "./BookDetailClientActions";

export const dynamic = "force-dynamic";

interface BookPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BookDetailPage({ params }: BookPageProps) {
  const { slug } = await params;
  const data = await getBookBySlug(slug);

  if (!data) {
    notFound();
  }

  const { work, author, editions, subjects } = data;
  const primaryEdition = editions[0];
  const coverUrl = primaryEdition?.coverUrl || "/books/moby-dick.jpg";
  const similarBooks = getSimilarBooks(slug, 6);

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[var(--paper)]/85 border-b border-[var(--line)] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--shelf-teal)] transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to Library Shelves
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            <span className="w-2 h-2 rounded-full bg-[var(--shelf-teal)] animate-pulse" />
            Verified Catalog Entry
          </div>
        </div>
      </header>

      {/* Main Book Detail Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Left Column: Book Cover & Shelf Actions */}
          <div className="md:col-span-4 flex flex-col items-center md:items-start">
            <div className="relative group w-64 md:w-full max-w-[280px] aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border-4 border-white/60 bg-[var(--surface)]">
              <img
                src={coverUrl}
                alt={work.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute top-3 right-3 bg-[var(--ink)]/80 backdrop-blur-md text-[var(--paper)] text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
                {work.audienceLevel}
              </div>
            </div>

            {/* Interactive Shelf Actions (Client Component) */}
            <div className="w-full max-w-[280px] mt-6">
              <BookDetailClientActions workId={work.id} workSlug={work.slug} />
            </div>

            {/* Public Domain Availability */}
            <div className="w-full max-w-[280px] mt-6 p-4 rounded-xl bg-[var(--surface)] border border-[var(--line)]">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--moss)] uppercase tracking-wider mb-2">
                <ShieldCheck className="w-4 h-4" />
                Public Domain Edition
              </div>
              <p className="text-xs text-[var(--muted)] mb-3 leading-relaxed">
                Freely available without digital restrictions or surveillance DRM.
              </p>
              <a
                href={`https://openlibrary.org/search?q=${encodeURIComponent(work.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--shelf-teal)] hover:underline"
              >
                <span>Read on Open Library</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Right Column: Work Information & Metadata */}
          <div className="md:col-span-8 flex flex-col">
            <div className="border-b border-[var(--line)] pb-6 mb-6">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {subjects.map((subj) => (
                  <span
                    key={subj}
                    className="text-xs px-2.5 py-1 rounded-full bg-[var(--surface)] border border-[var(--line)] font-medium text-[var(--muted)]"
                  >
                    {subj}
                  </span>
                ))}
              </div>

              <h1 className="text-3xl md:text-5xl font-serif font-bold tracking-tight mb-2">
                {work.title}
              </h1>

              {work.subtitle && (
                <p className="text-lg md:text-xl font-serif italic text-[var(--muted)] mb-3">
                  {work.subtitle}
                </p>
              )}

              <p className="text-lg text-[var(--muted)]">
                By{" "}
                <span className="font-semibold text-[var(--ink)]">
                  {author?.name || "Unknown Author"}
                </span>
              </p>
            </div>

            {/* Quick Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 px-6 rounded-xl bg-[var(--surface)] border border-[var(--line)] mb-8">
              <div className="flex flex-col">
                <span className="text-xs text-[var(--muted)] uppercase tracking-wider font-semibold flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[var(--shelf-teal)]" />
                  Published
                </span>
                <span className="font-serif font-bold text-base mt-0.5">
                  {work.firstPublishYear ? (work.firstPublishYear < 0 ? `${Math.abs(work.firstPublishYear)} BCE` : work.firstPublishYear) : "Classic"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-[var(--muted)] uppercase tracking-wider font-semibold flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-[var(--bookmark-amber)]" />
                  Length
                </span>
                <span className="font-serif font-bold text-base mt-0.5">
                  {primaryEdition?.pageCount || 250} pages
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-[var(--muted)] uppercase tracking-wider font-semibold flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-[var(--plum)]" />
                  Language
                </span>
                <span className="font-serif font-bold text-base mt-0.5">
                  English (en)
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-[var(--muted)] uppercase tracking-wider font-semibold flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-[var(--brick)]" />
                  Format
                </span>
                <span className="font-serif font-bold text-base mt-0.5 capitalize">
                  {primaryEdition?.format || "Paperback"}
                </span>
              </div>
            </div>

            {/* Description / Synopsis */}
            <div className="mb-8">
              <h2 className="text-xl font-serif font-bold mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[var(--shelf-teal)]" />
                Work Synopsis
              </h2>
              <p className="text-base text-[var(--ink)]/85 leading-relaxed font-serif text-justify bg-[var(--surface)]/50 p-6 rounded-2xl border border-[var(--line)]">
                {work.description || "A foundational literary work treasured across generations for its narrative depth and philosophical themes."}
              </p>
            </div>

            {/* Author Biography */}
            {author?.bio && (
              <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--line)]">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)] mb-2">
                  About {author.name}
                </h3>
                <p className="text-sm text-[var(--ink)]/80 leading-relaxed">
                  {author.bio}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Stage A: Content-Based Similar Books & Readers Also Enjoyed */}
        <SimilarBooksSection
          currentBookTitle={work.title}
          similarBooks={similarBooks}
        />
      </main>
    </div>
  );
}
