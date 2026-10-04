"use client";

import React, { useState, useEffect, use, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Settings,
  Type,
  Sun,
  Moon,
  Coffee,
  List,
  X,
  Bookmark,
  Check,
  Maximize2,
  Minimize2,
  RotateCcw,
} from "lucide-react";

interface ReaderChapter {
  id: number;
  title: string;
  subtitle?: string;
  paragraphs: string[];
}

interface ReaderData {
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

type ThemeMode = "paper" | "sepia" | "night";
type FontFamily = "serif" | "sans";
type FontSize = "sm" | "base" | "lg" | "xl";

export default function BookReaderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [data, setData] = useState<ReaderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reader state
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [theme, setTheme] = useState<ThemeMode>("paper");
  const [fontFamily, setFontFamily] = useState<FontFamily>("serif");
  const [fontSize, setFontSize] = useState<FontSize>("base");
  const [showToc, setShowToc] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const contentRef = useRef<HTMLDivElement>(null);

  // Fetch reader content
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch(`/api/books/${slug}/read`)
      .then((res) => {
        if (!res.ok) throw new Error("Could not load book text");
        return res.json();
      })
      .then((json: ReaderData) => {
        if (!isMounted) return;
        setData(json);

        // Restore saved chapter index
        try {
          const savedChap = localStorage.getItem(`reader_chapter_${slug}`);
          if (savedChap !== null) {
            const idx = parseInt(savedChap, 10);
            if (idx >= 0 && idx < json.chapters.length) {
              setCurrentChapterIndex(idx);
            }
          }
        } catch {
          // Ignore localStorage errors
        }

        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || "Failed to load book text");
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("reader_pref_theme") as ThemeMode;
      if (savedTheme) setTheme(savedTheme);

      const savedFont = localStorage.getItem("reader_pref_font") as FontFamily;
      if (savedFont) setFontFamily(savedFont);

      const savedSize = localStorage.getItem("reader_pref_size") as FontSize;
      if (savedSize) setFontSize(savedSize);
    } catch {
      // Ignore
    }
  }, []);

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const doc = document.documentElement;
      const totalScroll = doc.scrollHeight - doc.clientHeight;
      if (totalScroll > 0) {
        setScrollProgress((doc.scrollTop / totalScroll) * 100);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Save chapter index changes
  const changeChapter = (index: number) => {
    if (!data || index < 0 || index >= data.chapters.length) return;
    setCurrentChapterIndex(index);
    setShowToc(false);
    window.scrollTo({ top: 0, behavior: "smooth" });

    try {
      localStorage.setItem(`reader_chapter_${slug}`, index.toString());
    } catch {
      // Ignore
    }
  };

  const updateTheme = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    try {
      localStorage.setItem("reader_pref_theme", newTheme);
    } catch {}
  };

  const updateFontFamily = (newFont: FontFamily) => {
    setFontFamily(newFont);
    try {
      localStorage.setItem("reader_pref_font", newFont);
    } catch {}
  };

  const updateFontSize = (newSize: FontSize) => {
    setFontSize(newSize);
    try {
      localStorage.setItem("reader_pref_size", newSize);
    } catch {}
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "ArrowLeft" && e.altKey) {
        changeChapter(currentChapterIndex - 1);
      } else if (e.key === "ArrowRight" && e.altKey) {
        changeChapter(currentChapterIndex + 1);
      } else if (e.key === "Escape") {
        setShowToc(false);
        setShowSettings(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentChapterIndex, data]);

  // Color theme classes
  const themeStyles = {
    paper: {
      bg: "bg-[#FAF7F2]",
      text: "text-[#2A2421]",
      headerBg: "bg-[#FAF7F2]/90 border-[#E7DFD5]",
      surface: "bg-[#F3ECE1]",
      border: "border-[#E7DFD5]",
      muted: "text-[#786C63]",
      highlight: "text-teal-800",
      accent: "bg-teal-800 text-white",
    },
    sepia: {
      bg: "bg-[#F4EBD9]",
      text: "text-[#3D3021]",
      headerBg: "bg-[#F4EBD9]/90 border-[#E2D5BE]",
      surface: "bg-[#EAE0CA]",
      border: "border-[#E2D5BE]",
      muted: "text-[#806E57]",
      highlight: "text-amber-900",
      accent: "bg-amber-900 text-white",
    },
    night: {
      bg: "bg-[#141416]",
      text: "text-[#E6E4DF]",
      headerBg: "bg-[#141416]/90 border-[#2A2A2E]",
      surface: "bg-[#1F1F24]",
      border: "border-[#2A2A2E]",
      muted: "text-[#9E9CA3]",
      highlight: "text-teal-400",
      accent: "bg-teal-600 text-white",
    },
  }[theme];

  // Font size classes
  const fontSizeClass = {
    sm: "text-base leading-relaxed sm:text-[17px] sm:leading-8",
    base: "text-lg leading-relaxed sm:text-[19px] sm:leading-8 md:text-[20px] md:leading-9",
    lg: "text-xl leading-relaxed sm:text-[22px] sm:leading-9 md:text-[23px] md:leading-10",
    xl: "text-2xl leading-relaxed sm:text-[25px] sm:leading-10 md:text-[26px] md:leading-11",
  }[fontSize];

  const currentChapter = data?.chapters[currentChapterIndex];

  if (loading) {
    return (
      <div className={`min-h-screen ${themeStyles.bg} ${themeStyles.text} flex flex-col items-center justify-center p-6`}>
        <div className="w-16 h-16 rounded-full border-4 border-teal-700/20 border-t-teal-700 animate-spin mb-6" />
        <h2 className="font-serif text-2xl font-bold tracking-tight">Preparing Reading Edition...</h2>
        <p className={`text-sm mt-2 ${themeStyles.muted}`}>
          Loading chapters and typesetting into reader view...
        </p>
      </div>
    );
  }

  if (error || !data || !currentChapter) {
    return (
      <div className={`min-h-screen ${themeStyles.bg} ${themeStyles.text} flex flex-col items-center justify-center p-6 text-center`}>
        <BookOpen className="w-12 h-12 text-stone-400 mb-4" />
        <h2 className="font-serif text-2xl font-bold tracking-tight mb-2">Book Not Available</h2>
        <p className={`text-sm max-w-md mb-6 ${themeStyles.muted}`}>
          {error || "We could not find the reading text for this edition."}
        </p>
        <Link
          href={`/book/${slug}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-800 text-white font-medium text-sm hover:bg-teal-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Book Details
        </Link>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeStyles.bg} ${themeStyles.text} transition-colors duration-300`}>
      {/* Pinned Top Navigation Bar */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b ${themeStyles.headerBg} transition-colors duration-300`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">
          {/* Left: Back Link & Book Title */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/book/${slug}`}
              className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium ${themeStyles.muted} hover:${themeStyles.highlight} transition-colors shrink-0`}
              title="Return to book details"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Book Details</span>
            </Link>

            <span className={`hidden sm:inline text-xs ${themeStyles.muted}`}>/</span>

            <div className="min-w-0 truncate">
              <h1 className="text-xs sm:text-sm font-serif font-bold truncate">
                {data.book.title}
              </h1>
              <p className={`text-[10px] sm:text-xs truncate ${themeStyles.muted}`}>
                {currentChapter.title}
              </p>
            </div>
          </div>

          {/* Right: Controls (TOC, Settings, Fullscreen) */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Table of Contents Button */}
            <button
              type="button"
              onClick={() => setShowToc(!showToc)}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium border ${themeStyles.border} ${themeStyles.surface} hover:opacity-90 transition-all`}
              aria-label="Table of contents"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Chapters</span>
              <span className="text-[11px] opacity-75">
                {currentChapterIndex + 1}/{data.chapters.length}
              </span>
            </button>

            {/* Typography / Theme Settings Dropdown Trigger */}
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className={`p-1.5 sm:p-2 rounded-lg border ${themeStyles.border} ${themeStyles.surface} hover:opacity-90 transition-all`}
              title="Reader settings"
              aria-label="Reader appearance settings"
            >
              <Type className="w-4 h-4" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className={`hidden sm:inline-flex p-1.5 sm:p-2 rounded-lg border ${themeStyles.border} ${themeStyles.surface} hover:opacity-90 transition-all`}
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              aria-label="Toggle fullscreen mode"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Scroll Progress Indicator Bar */}
        <div className="w-full h-0.5 bg-black/5 dark:bg-white/5">
          <div
            className="h-full bg-teal-600 transition-all duration-100 ease-out"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>
      </header>

      {/* Reader Settings Modal / Drawer */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 bg-black/30 backdrop-blur-xs">
          <div
            className={`w-full max-w-sm rounded-2xl border p-5 shadow-2xl ${themeStyles.bg} ${themeStyles.border} ${themeStyles.text} animate-in fade-in slide-in-from-top-4`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-current/10 mb-4">
              <h3 className="font-serif font-bold text-base flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Reading Preferences
              </h3>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Theme Selector */}
            <div className="mb-5">
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-75">
                Background & Paper Theme
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => updateTheme("paper")}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                    theme === "paper"
                      ? "border-teal-700 bg-[#FAF7F2] text-[#2A2421] ring-2 ring-teal-700/30"
                      : "border-stone-300 bg-[#FAF7F2] text-[#2A2421] opacity-70 hover:opacity-100"
                  }`}
                >
                  <Sun className="w-4 h-4 text-amber-700" />
                  Warm Cream
                </button>

                <button
                  type="button"
                  onClick={() => updateTheme("sepia")}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                    theme === "sepia"
                      ? "border-amber-800 bg-[#F4EBD9] text-[#3D3021] ring-2 ring-amber-800/30"
                      : "border-amber-300 bg-[#F4EBD9] text-[#3D3021] opacity-70 hover:opacity-100"
                  }`}
                >
                  <Coffee className="w-4 h-4 text-amber-800" />
                  Sepia
                </button>

                <button
                  type="button"
                  onClick={() => updateTheme("night")}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                    theme === "night"
                      ? "border-teal-500 bg-[#141416] text-[#E6E4DF] ring-2 ring-teal-500/30"
                      : "border-neutral-800 bg-[#141416] text-[#E6E4DF] opacity-70 hover:opacity-100"
                  }`}
                >
                  <Moon className="w-4 h-4 text-teal-400" />
                  Pure Night
                </button>
              </div>
            </div>

            {/* Font Family Selector */}
            <div className="mb-5">
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-75">
                Typeface
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateFontFamily("serif")}
                  className={`p-2 rounded-xl border text-sm font-serif font-bold transition-all ${
                    fontFamily === "serif"
                      ? `${themeStyles.accent}`
                      : `${themeStyles.surface} ${themeStyles.border} opacity-75 hover:opacity-100`
                  }`}
                >
                  Literary Serif
                </button>
                <button
                  type="button"
                  onClick={() => updateFontFamily("sans")}
                  className={`p-2 rounded-xl border text-sm font-sans font-medium transition-all ${
                    fontFamily === "sans"
                      ? `${themeStyles.accent}`
                      : `${themeStyles.surface} ${themeStyles.border} opacity-75 hover:opacity-100`
                  }`}
                >
                  Modern Sans
                </button>
              </div>
            </div>

            {/* Font Size Selector */}
            <div className="mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-75">
                Text Size
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(["sm", "base", "lg", "xl"] as FontSize[]).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => updateFontSize(sz)}
                    className={`py-2 rounded-xl border font-bold text-xs uppercase transition-all ${
                      fontSize === sz
                        ? `${themeStyles.accent}`
                        : `${themeStyles.surface} ${themeStyles.border} opacity-75 hover:opacity-100`
                    }`}
                  >
                    {sz === "sm" ? "Small" : sz === "base" ? "Medium" : sz === "lg" ? "Large" : "Huge"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table of Contents Drawer */}
      {showToc && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setShowToc(false)}
          />

          {/* Drawer Sidebar */}
          <div
            className={`relative z-10 w-full max-w-sm sm:max-w-md h-full flex flex-col border-r shadow-2xl ${themeStyles.bg} ${themeStyles.border} ${themeStyles.text}`}
          >
            {/* Drawer Header */}
            <div className={`p-4 border-b ${themeStyles.border} flex items-center justify-between`}>
              <div>
                <h3 className="font-serif font-bold text-base">Table of Contents</h3>
                <p className={`text-xs ${themeStyles.muted}`}>
                  {data.chapters.length} chapters · {data.source === "gutenberg" ? "Gutenberg Full Edition" : "Curated Edition"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowToc(false)}
                className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chapter List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {data.chapters.map((chap, idx) => (
                <button
                  key={chap.id}
                  type="button"
                  onClick={() => changeChapter(idx)}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-start justify-between gap-3 ${
                    idx === currentChapterIndex
                      ? `${themeStyles.accent} font-semibold shadow-xs`
                      : `hover:${themeStyles.surface} opacity-85 hover:opacity-100`
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-serif truncate">
                      {chap.title}
                    </p>
                    {chap.subtitle && (
                      <p className="text-xs opacity-75 truncate mt-0.5">
                        {chap.subtitle}
                      </p>
                    )}
                  </div>
                  {idx === currentChapterIndex && (
                    <Check className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Reading Document Content */}
      <main
        ref={contentRef}
        className={`max-w-3xl mx-auto px-5 sm:px-8 py-10 sm:py-16 ${
          fontFamily === "serif" ? "font-serif" : "font-sans"
        }`}
      >
        {/* Book & Chapter Header Card */}
        <div className="text-center pb-10 sm:pb-14 border-b border-current/10 mb-10 sm:mb-14">
          <p className={`text-xs uppercase tracking-widest font-semibold mb-2 ${themeStyles.muted}`}>
            {data.book.authorName} · {data.book.year < 0 ? `${Math.abs(data.book.year)} BCE` : data.book.year}
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-3">
            {currentChapter.title}
          </h2>
          {currentChapter.subtitle && (
            <p className={`text-base sm:text-lg italic mt-1 ${themeStyles.muted}`}>
              {currentChapter.subtitle}
            </p>
          )}

          <div className="mt-4 flex items-center justify-center gap-3 text-xs opacity-60">
            <span>Chapter {currentChapterIndex + 1} of {data.chapters.length}</span>
            <span>·</span>
            <span>~{Math.max(1, Math.round(currentChapter.paragraphs.join(" ").split(" ").length / 220))} min read</span>
          </div>
        </div>

        {/* Chapter Paragraphs */}
        <article className="space-y-6 sm:space-y-7">
          {currentChapter.paragraphs.map((p, idx) => (
            <p
              key={idx}
              className={`${fontSizeClass} text-justify tracking-normal selection:bg-teal-500/20`}
            >
              {idx === 0 && (
                <span className="float-left text-4xl sm:text-5xl font-bold font-serif leading-none pr-3 pt-1 text-teal-800 dark:text-teal-400">
                  {p.charAt(0)}
                </span>
              )}
              {idx === 0 ? p.slice(1) : p}
            </p>
          ))}
        </article>

        {/* Bottom Chapter Navigation Bar */}
        <div className="mt-16 pt-8 border-t border-current/15 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            disabled={currentChapterIndex === 0}
            onClick={() => changeChapter(currentChapterIndex - 1)}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border ${themeStyles.border} ${themeStyles.surface} text-sm font-semibold transition-all disabled:opacity-30 disabled:pointer-events-none hover:opacity-90`}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous Chapter
          </button>

          <button
            type="button"
            onClick={() => setShowToc(true)}
            className={`text-xs font-semibold ${themeStyles.muted} hover:${themeStyles.highlight} transition-colors underline`}
          >
            View All {data.chapters.length} Chapters
          </button>

          <button
            type="button"
            disabled={currentChapterIndex >= data.chapters.length - 1}
            onClick={() => changeChapter(currentChapterIndex + 1)}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl ${themeStyles.accent} text-sm font-semibold transition-all disabled:opacity-30 disabled:pointer-events-none shadow-md hover:brightness-110`}
          >
            Next Chapter
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Curator & Legal Note */}
        <div className="mt-14 p-5 rounded-2xl border border-current/10 bg-black/5 dark:bg-white/5 text-center text-xs opacity-75">
          <p className="font-semibold mb-1">In-Browser Open Reader Edition</p>
          <p>
            Text provided through public domain archives with custom browser formatting. No external downloads or third-party redirects required.
          </p>
        </div>
      </main>
    </div>
  );
}
