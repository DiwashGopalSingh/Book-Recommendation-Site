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
  const startMatch = raw.match(/\*\*\* START OF TH(?:E|IS) PROJECT GUTENBERG[^\n\r]*\*\*\*/i);
  let text = startMatch ? raw.substring(startMatch.index! + startMatch[0].length) : raw;

  // Strip end boilerplate
  const endMatch = text.match(/\*\*\* END OF TH(?:E|IS) PROJECT GUTENBERG[^\n\r]*\*\*\*/i);
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

  if (rawParts.length > 1) {
    let chapterIndex = 1;
    for (let i = 0; i < rawParts.length; i++) {
      const part = rawParts[i].trim();
      if (!part) continue;

      // Extract chapter heading
      const lines = part.split(/\r?\n/).map(l => l.trim());
      let title = `Chapter ${chapterIndex}`;
      let subtitle: string | undefined = undefined;
      let contentStartIndex = 0;

      if (lines.length > 0) {
        const firstLine = lines[0];
        if (/^(?:CHAPTER|Chapter|BOOK|Book|ACT|Act|PART|Part|STAVE|Stave|CANTO|Canto)/i.test(firstLine)) {
          title = firstLine.replace(/[\.\:\—\-]+$/, "").trim();
          contentStartIndex = 1;


        }
      }

      // Extract paragraphs: split by 2 or more newlines, join internal linebreaks
      const bodyLines = lines.slice(contentStartIndex);
      const joinedBody = bodyLines.join("\n");
      const paragraphs = joinedBody
        .split(/\n{2,}/)
        .map(p => p.replace(/\r?\n/g, " ").replace(/\s{2,}/g, " ").trim())
        .filter(p => p.length > 0 && !p.startsWith("Produced by ") && !p.startsWith("End of the Project Gutenberg"));

      if (paragraphs.length > 0) {
        chapters.push({
          id: chapterIndex,
          title,

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
      .filter(Boolean);

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
    const fetched = catalogBook ? null : await getBookBySlug(slug);
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
      const res = await fetch(`https://www.gutenberg.org/cache/epub/${gutenbergId}/pg${gutenbergId}.txt`, {
        signal: AbortSignal.timeout(6000),
        cache: "no-store",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });


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
    chapters = [{
      id: 1,
      title: "About this book",
      subtitle: "Editorial notes · Full text unavailable",
      paragraphs: [description, curatorNote, authorBio].filter(Boolean),
    }];
  }

  const responseData: ReaderResponse = {
    book: bookMeta,
    totalChapters: chapters.length,
    chapters,
    source,
  };

  // Cache in-memory
  if (source === "gutenberg") cache.set(slug, responseData);

  return NextResponse.json(responseData, { headers: { "Cache-Control": "no-store" } });
}
