"use client";

import { useState, useEffect } from "react";
import { Bookmark, Check, Star, BookOpen, Clock, Heart, Trash2 } from "lucide-react";

interface Props {
  workId: string;
  workSlug: string;
}

export default function BookDetailClientActions({ workId, workSlug }: Props) {
  const [status, setStatus] = useState<string | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadShelfStatus() {
      try {
        const queryParam = workSlug ? `slug=${encodeURIComponent(workSlug)}` : `workId=${workId}`;
        const res = await fetch(`/api/shelves?${queryParam}`);
        const data = await res.json();
        if (data.entry) {
          setStatus(data.entry.status);
          setRating(data.entry.rating);
        }
      } catch (err) {
        console.error("Failed to load shelf status:", err);
      }
    }
    loadShelfStatus();
  }, [workId, workSlug]);

  const handleShelfChange = async (newStatus: string) => {
    const updatedStatus = status === newStatus ? null : newStatus;
    setStatus(updatedStatus);
    setLoading(true);

    try {
      const res = await fetch("/api/shelves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workId,
          workSlug,
          status: updatedStatus || "remove",
          rating,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSavedMessage(
          updatedStatus ? `Added to "${formatShelfName(updatedStatus)}"` : "Removed from shelves"
        );
        setTimeout(() => setSavedMessage(null), 3000);
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("shelf-updated", { detail: { count: data.totalShelved } })
          );
        }
      }
    } catch (err) {
      console.error("Failed to update shelf:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRating = async (val: number) => {
    const newRating = rating === val ? null : val;
    setRating(newRating);

    try {
      await fetch("/api/shelves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workId,
          workSlug,
          status: status || "read", // default to read if giving rating
          rating: newRating,
        }),
      });
      if (!status) setStatus("read");
      setSavedMessage(`Rated ${newRating} stars`);
      setTimeout(() => setSavedMessage(null), 2500);
    } catch (err) {
      console.error("Failed to update rating:", err);
    }
  };

  const formatShelfName = (s: string) => {
    switch (s) {
      case "want_to_read":
        return "Want to Read";
      case "reading":
        return "Currently Reading";
      case "read":
        return "Read";
      case "did_not_finish":
        return "Did Not Finish";
      default:
        return s;
    }
  };

  return (
    <div className="flex flex-col gap-4 p-5 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
          My Private Shelf
        </h3>
        {savedMessage && (
          <span className="text-xs font-semibold text-[var(--shelf-teal)] animate-fade-in flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            {savedMessage}
          </span>
        )}
      </div>

      {/* Shelf Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => handleShelfChange("want_to_read")}
          disabled={loading}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
            status === "want_to_read"
              ? "bg-[var(--shelf-teal)] text-white shadow-md shadow-[var(--shelf-teal)]/20"
              : "bg-white/80 dark:bg-zinc-800/80 hover:bg-white text-[var(--ink)] border border-[var(--line)]"
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Want to Read</span>
        </button>

        <button
          onClick={() => handleShelfChange("reading")}
          disabled={loading}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
            status === "reading"
              ? "bg-[var(--bookmark-amber)] text-white shadow-md shadow-[var(--bookmark-amber)]/20"
              : "bg-white/80 dark:bg-zinc-800/80 hover:bg-white text-[var(--ink)] border border-[var(--line)]"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Reading</span>
        </button>

        <button
          onClick={() => handleShelfChange("read")}
          disabled={loading}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
            status === "read"
              ? "bg-[var(--moss)] text-white shadow-md shadow-[var(--moss)]/20"
              : "bg-white/80 dark:bg-zinc-800/80 hover:bg-white text-[var(--ink)] border border-[var(--line)]"
          }`}
        >
          <Check className="w-3.5 h-3.5" />
          <span>Read</span>
        </button>

        <button
          onClick={() => handleShelfChange("did_not_finish")}
          disabled={loading}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
            status === "did_not_finish"
              ? "bg-[var(--brick)] text-white shadow-md shadow-[var(--brick)]/20"
              : "bg-white/80 dark:bg-zinc-800/80 hover:bg-white text-[var(--ink)] border border-[var(--line)]"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>DNF</span>
        </button>
      </div>

      {/* Remove from Shelf option if book is currently on any shelf */}
      {status && (
        <button
          type="button"
          onClick={() => handleShelfChange("remove")}
          disabled={loading}
          className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 transition-all cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Remove from My Shelf</span>
        </button>
      )}

      {/* Private Rating */}
      <div className="pt-3 border-t border-[var(--line)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-[var(--muted)]">Private Rating</span>
          <span className="text-xs font-semibold text-[var(--ink)]">
            {rating ? `${rating} / 5` : "Not rated"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleRating(star)}
              className="p-1 text-[var(--muted)] hover:text-[var(--bookmark-amber)] transition-colors"
              title={`${star} stars`}
            >
              <Star
                className={`w-5 h-5 transition-transform hover:scale-110 ${
                  rating && rating >= star
                    ? "fill-[var(--bookmark-amber)] text-[var(--bookmark-amber)]"
                    : ""
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
