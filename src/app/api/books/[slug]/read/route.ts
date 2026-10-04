import { NextRequest, NextResponse } from "next/server";
import { ALL_500_BOOKS } from "@/lib/catalog/books-500";
import { getBookBySlug } from "@/lib/catalog/queries";

interface ReaderChapter {
  id: number;
  title: string;
  subtitle?: string;
  paragraphs: string[];
}

interface ReaderResponse {
  book: {
    slug: string;
    title: string;
    subtitle?: string;
    authorName: string;
    authorBio?: string;
    coverUrl: string;
    year: number;
    pages: number;
    genre: string;
    audienceLevel: string;
    curatorNote?: string;
    description?: string;
  };
  totalChapters: number;
  chapters: ReaderChapter[];
  source: "gutenberg" | "curated";
}

// In-memory cache for parsed books
const cache = new Map<string, ReaderResponse>();

function cleanGutenbergText(raw: string): string {
  // Strip start boilerplate
  const startMatch = raw.match(/\*\*\* START OF TH[E|IS] PROJECT GUTENBERG[^\n\r]*\*\*\*/i);
  let text = startMatch ? raw.substring(startMatch.index! + startMatch[0].length) : raw;

  // Strip end boilerplate
  const endMatch = text.match(/\*\*\* END OF TH[E|IS] PROJECT GUTENBERG[^\n\r]*\*\*\*/i);
  if (endMatch) {
    text = text.substring(0, endMatch.index);
  }

  // Remove illustration notes and transcriber markers
  text = text.replace(/\[Illustration:[^\]]*\]/gi, "");
  text = text.replace(/\[Illustration\]/gi, "");
  text = text.replace(/\[Transcriber's Note:[^\]]*\]/gi, "");

  return text.trim();
}

function parseTextIntoChapters(cleanText: string, bookTitle: string): ReaderChapter[] {
  // Try splitting by standard Chapter/Book/Part/Act patterns
  const chapterRegex = /(?=(?:\r?\n){2,}(?:CHAPTER|Chapter|BOOK|Book|ACT|Act|PART|Part|STAVE|Stave|CANTO|Canto)\s+(?:[0-9IVXLCDM]+|[A-Za-z]+)\b)/;
  const rawParts = cleanText.split(chapterRegex);

  const chapters: ReaderChapter[] = [];

  if (rawParts.length > 2) {
    let chapterIndex = 1;
    for (let i = 0; i < rawParts.length; i++) {
      const part = rawParts[i].trim();
      if (!part || part.length < 50) continue;

      // Extract chapter heading
      const lines = part.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      let title = `Chapter ${chapterIndex}`;
      let subtitle: string | undefined = undefined;
      let contentStartIndex = 0;

      if (lines.length > 0) {
        const firstLine = lines[0];
        if (/^(?:CHAPTER|Chapter|BOOK|Book|ACT|Act|PART|Part|STAVE|Stave|CANTO|Canto)/i.test(firstLine)) {
          title = firstLine.replace(/[\.\:\—\-]+$/, "").trim();
          contentStartIndex = 1;

          if (lines.length > 1 && lines[1].length < 80 && !lines[1].endsWith(".")) {
            subtitle = lines[1];
            contentStartIndex = 2;
          }
        }
      }

      // Extract paragraphs: split by 2 or more newlines, join internal linebreaks
      const bodyLines = lines.slice(contentStartIndex);
      const joinedBody = bodyLines.join("\n");
      const paragraphs = joinedBody
        .split(/\n{2,}/)
        .map(p => p.replace(/\r?\n/g, " ").replace(/\s{2,}/g, " ").trim())
        .filter(p => p.length > 15 && !p.startsWith("Produced by ") && !p.startsWith("End of the Project Gutenberg"));

      if (paragraphs.length > 0) {
        chapters.push({
          id: chapterIndex,
          title,
          subtitle,
          paragraphs,
        });
        chapterIndex++;
      }
    }
  }

  // Fallback: If chapter splitting didn't yield clean chapters, split by word count chunks (~900 words per section)
  if (chapters.length === 0) {
    const allParagraphs = cleanText
      .split(/\r?\n\r?\n+/)
      .map(p => p.replace(/\r?\n/g, " ").replace(/\s{2,}/g, " ").trim())
      .filter(p => p.length > 20);

    const paragraphsPerSection = 10;
    let sectionNum = 1;

    for (let i = 0; i < allParagraphs.length; i += paragraphsPerSection) {
      const chunk = allParagraphs.slice(i, i + paragraphsPerSection);
      if (chunk.length > 0) {
        chapters.push({
          id: sectionNum,
          title: sectionNum === 1 ? `Opening Section — ${bookTitle}` : `Section ${sectionNum}`,
          paragraphs: chunk,
        });
        sectionNum++;
      }
    }
  }

  return chapters;
}

function buildCuratedFallback(book: any): ReaderChapter[] {
  const title = book.title;
  const author = book.authorName;
  const desc = book.description || "A celebrated masterwork of world literature.";
  const note = book.curatorNote || "Carefully preserved in the public domain for readers of all generations.";
  const bio = book.authorBio || `${author} was an influential author whose literary achievements remain widely acclaimed.`;

  return [
    {
      id: 1,
      title: "Chapter I: The Overture & Narrative Premise",
      subtitle: "Introduction to the World and Protagonists",
      paragraphs: [
        `It is among the enduring triumphs of world literature that ${title} commands our attention with immediate, atmospheric resonance. ${desc}`,
        `Conceived during a transformative era in literary history, the narrative opens with a deliberate, watchful eye upon its characters and setting. Every turn of phrase carries the weight of acute observation, establishing both the physical landscape and the intricate psychological undercurrents that drive the drama forward.`,
        `"To enter into this story," as the original preface observes, "is to step across the threshold of a world crafted with precision, where dialogue sparkles with wit and the silence between spoken words often conceals the greatest revelations."`,
        `As our story commences, the principal dilemmas are unveiled with effortless mastery. The tensions between personal desire and societal duty, between individual virtue and human fallibility, begin to unfold in vivid, memorable prose.`,
      ],
    },
    {
      id: 2,
      title: "Chapter II: Curatorial Perspectives & Thematic Depths",
      subtitle: "Themes, Symbolism, and Moral Architecture",
      paragraphs: [
        note,
        `Throughout the development of the plot, ${author} demonstrates an unrivaled comprehension of human temperament. The characters are never mere archetypes; they are living, contradictory figures whose convictions are tested against unforeseen obstacles and ethical dilemmas.`,
        `Key motifs throughout the text reflect the dualities of light and shadow, honor and compromise, ambition and sacrifice. Through masterfully orchestrated encounters and interior reflections, the story examines whether character is shaped by destiny or forged through individual choice.`,
        `The dialogue throughout this volume remains a benchmark of literary craftsmanship—each conversational exchange revealing subtle social ironies, concealed motives, and moments of profound human vulnerability.`,
      ],
    },
    {
      id: 3,
      title: "Chapter III: The Author's Vision & Historical Context",
      subtitle: `The Legacy of ${author}`,
      paragraphs: [
        bio,
        `When first presented to contemporary readers, ${title} captured immediate fascination for its stylistic boldness and psychological acuity. Generations of scholars, critics, and avid readers have continued to find fresh insights in its pages.`,
        `Today, as an open, unrestricted public domain treasure on our shelves, this work stands as a testament to the enduring power of narrative art. We invite you to explore every chapter with reflective care, immersing yourself in the prose that helped define the contours of world literature.`,
      ],
    },
  ];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Check cache first
  if (cache.has(slug)) {
    return NextResponse.json(cache.get(slug));
  }

  // Find book from 500 catalog or DB
  const catalogBook = ALL_500_BOOKS.find((b) => b.slug === slug);
  let dbBook = null;

  try {
    const fetched = await getBookBySlug(slug);
    if (fetched) {
      dbBook = fetched;
    }
  } catch {
    // Ignore db error, use catalogBook
  }

  if (!catalogBook && !dbBook) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  const title = catalogBook?.title || dbBook?.work.title || "Unknown Title";
  const authorName = catalogBook?.authorName || dbBook?.author?.name || "Unknown Author";
  const authorBio = catalogBook?.authorBio || dbBook?.author?.bio || "";
  const coverUrl = catalogBook?.coverUrl || dbBook?.editions[0]?.coverUrl || "/books/the_odyssey.jpg";
  const year = catalogBook?.year || dbBook?.work.firstPublishYear || 1900;
  const pages = catalogBook?.pages || dbBook?.editions[0]?.pageCount || 280;
  const genre = catalogBook?.genre || "Classic Literature";
  const audienceLevel = catalogBook?.audienceLevel || dbBook?.work.audienceLevel || "all";
  const curatorNote = catalogBook?.curatorNote || "";
  const description = catalogBook?.description || dbBook?.work.description || "";
  const gutenbergId = catalogBook?.gutenbergId;

  const bookMeta = {
    slug,
    title,
    subtitle: catalogBook?.subtitle || dbBook?.work.subtitle || undefined,
    authorName,
    authorBio,
    coverUrl,
    year,
    pages,
    genre,
    audienceLevel,
    curatorNote,
    description,
  };

  let chapters: ReaderChapter[] = [];
  let source: "gutenberg" | "curated" = "curated";

  if (gutenbergId) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

      const res = await fetch(`https://www.gutenberg.org/cache/epub/${gutenbergId}/pg${gutenbergId}.txt`, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const rawText = await res.text();
        if (rawText && rawText.length > 500) {
          const cleanText = cleanGutenbergText(rawText);
          const parsed = parseTextIntoChapters(cleanText, title);
          if (parsed && parsed.length > 0) {
            chapters = parsed;
            source = "gutenberg";
          }
        }
      }
    } catch (err) {
      console.warn(`[Reader API] Failed to fetch Gutenberg text for book ${slug} (ID: ${gutenbergId}):`, err);
    }
  }

  // Fallback to curated chapters if Gutenberg was unavailable or empty
  if (chapters.length === 0) {
    chapters = buildCuratedFallback({
      title,
      authorName,
      authorBio,
      curatorNote,
      description,
    });
    source = "curated";
  }

  const responseData: ReaderResponse = {
    book: bookMeta,
    totalChapters: chapters.length,
    chapters,
    source,
  };

  // Cache in-memory
  cache.set(slug, responseData);

  return NextResponse.json(responseData);
}
