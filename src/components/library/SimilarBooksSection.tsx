import Link from "next/link";
import { Sparkles, ArrowRight, BookOpen, Layers } from "lucide-react";
import { SimilarBookMatch } from "@/lib/recommend/engine";

interface SimilarBooksSectionProps {
  currentBookTitle: string;
  similarBooks: SimilarBookMatch[];
}

export default function SimilarBooksSection({
  currentBookTitle,
  similarBooks,
}: SimilarBooksSectionProps) {
  if (!similarBooks || similarBooks.length === 0) return null;

  return (
    <section className="mt-16 pt-12 border-t border-[var(--line)]">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--shelf-teal)] uppercase tracking-wider mb-1.5">
            <Sparkles className="w-4 h-4" />
            <span>Content-Based Recommendation Engine</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-[var(--ink)]">
            Readers Also Enjoyed
          </h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            Hand-matched based on thematic overlap with{" "}
            <span className="font-semibold text-[var(--ink)] italic">
              {currentBookTitle}
            </span>
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-[var(--muted)] bg-[var(--surface)] px-3 py-1.5 rounded-full border border-[var(--line)]">
          <Layers className="w-3.5 h-3.5 text-[var(--shelf-teal)]" />
          <span>Vector & Subject Similarity</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {similarBooks.map((book) => (
          <Link
            key={book.slug}
            href={`/book/${book.slug}`}
            className="group flex flex-col bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--shelf-teal)]/50 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
          >
            {/* Cover Container */}
            <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-900/10">
              <img
                src={book.coverUrl}
                alt={book.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              {/* Match Score Badge */}
              <div className="absolute top-2 right-2 bg-neutral-900/85 backdrop-blur-md text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 shadow-md">
                {book.matchPercentage}% Match
              </div>

              {/* Genre pill */}
              <div className="absolute bottom-2 left-2 bg-neutral-900/80 backdrop-blur-sm text-neutral-200 text-[9px] font-medium px-1.5 py-0.5 rounded">
                {book.genreBadge}
              </div>
            </div>

            {/* Book Info */}
            <div className="p-3 flex flex-col flex-1 justify-between">
              <div>
                <h3 className="font-serif font-bold text-sm text-[var(--ink)] line-clamp-1 group-hover:text-[var(--shelf-teal)] transition-colors">
                  {book.title}
                </h3>
                <p className="text-xs text-[var(--muted)] line-clamp-1 mt-0.5">
                  {book.authorName}
                </p>
              </div>

              {/* Transparent Reason Tag */}
              <div className="mt-2.5 pt-2 border-t border-[var(--line)]/60">
                <p className="text-[10px] font-medium text-[var(--shelf-teal)] line-clamp-2 leading-tight">
                  {book.reason}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
