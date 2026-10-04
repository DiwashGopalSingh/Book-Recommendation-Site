/**
 * Open Library Server-side Adapter
 * Adheres strictly to Context/SECURITY.md & Context/ARCHITECTURE.md:
 * - Server-side only (never called directly by client)
 * - Identifies with polite User-Agent
 * - Timeout handling and rate limit safety
 */

const USER_AGENT = "CommunityBookTracker/1.0 (contact@communitylibrary.local)";
const REQUEST_TIMEOUT_MS = 6000;

export interface OpenLibraryWorkResult {
  key: string;
  title: string;
  first_publish_year?: number;
  author_name?: string[];
  cover_i?: number;
  subject?: string[];
}

export async function searchOpenLibrary(query: string, limit = 10): Promise<OpenLibraryWorkResult[]> {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${limit}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      console.warn(`Open Library API responded with status ${res.status}`);
      return [];
    }

    const data = await res.json();
    return (data.docs || []).map((doc: any) => ({
      key: doc.key,
      title: doc.title,
      first_publish_year: doc.first_publish_year,
      author_name: doc.author_name || [],
      cover_i: doc.cover_i,
      subject: (doc.subject || []).slice(0, 5),
    }));
  } catch (error) {
    if ((error as any).name === "AbortError") {
      console.warn("Open Library request timed out after", REQUEST_TIMEOUT_MS, "ms");
    } else {
      console.error("Open Library search error:", error);
    }
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getOpenLibraryWorkDetails(workKey: string) {
  const cleanKey = workKey.replace(/^\/works\//, "");
  const url = `https://openlibrary.org/works/${cleanKey}.json`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Open Library work fetch error:", error);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
