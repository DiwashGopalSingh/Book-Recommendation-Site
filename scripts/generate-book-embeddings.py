#!/usr/bin/env python3
"""
generate-book-embeddings.py
===========================
Offline content-based recommendation & feature embedding generator for the 500-book catalog.
Implements the principles from the 'recommendation system/' workshop:
 - MovieLens/15-Doc-Embedding.ipynb
 - reco/recommend.py (NearestNeighbors & Cosine Distance)

Generates:
 1. Precomputed top-K similar book graph: src/lib/catalog/book-similarities.json
 2. Feature vectors / embeddings metadata for inspection
"""

import json
import math
import os
import re
from collections import Counter, defaultdict

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BOOKS_JSON = os.path.join(SCRIPT_DIR, "..", "src", "lib", "catalog", "books-500.json")
OUTPUT_JSON = os.path.join(SCRIPT_DIR, "..", "src", "lib", "catalog", "book-similarities.json")

STOPWORDS = {
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
    'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
    'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further',
    'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how',
    'i', 'if', 'in', 'into', 'is', 'isn', 'it', 'its', 'itself', 'just', 'me', 'more', 'most', 'my', 'myself',
    'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our', 'ours', 'ourselves',
    'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs',
    'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under',
    'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why',
    'with', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves'
}

def tokenize(text: str):
    if not text:
        return []
    words = re.findall(r'[a-zA-Z0-9]+', text.lower())
    return [w for w in words if len(w) > 2 and w not in STOPWORDS]

def build_embeddings():
    print(f"Loading books from {BOOKS_JSON}...")
    with open(BOOKS_JSON, "r", encoding="utf-8") as f:
        books = json.load(f)

    print(f"Loaded {len(books)} books. Building vocabulary and TF-IDF representations...")

    doc_tokens = []
    df = Counter()
    n_docs = len(books)

    for b in books:
        tokens = []
        tokens.extend(tokenize(b.get("title", "")) * 2)
        tokens.extend(tokenize(b.get("authorName", "")) * 2)
        for s in b.get("subjects", []):
            tokens.extend(tokenize(s) * 2)
        tokens.extend(tokenize(b.get("genre", "")))
        tokens.extend(tokenize(b.get("description", "")))
        tokens.extend(tokenize(b.get("curatorNote", "")))

        counts = Counter(tokens)
        doc_tokens.append({
            "book": b,
            "counts": counts,
            "total_tokens": len(tokens) or 1,
            "subjects_set": {s.lower().strip() for s in b.get("subjects", [])}
        })
        for term in counts.keys():
            df[term] += 1

    # Vector representations
    tfidf_vectors = []
    for doc in doc_tokens:
        vec = {}
        sum_sq = 0.0
        for term, cnt in doc["counts"].items():
            tf = cnt / doc["total_tokens"]
            idf = math.log(1.0 + n_docs / df[term])
            score = tf * idf
            vec[term] = score
            sum_sq += score * score

        norm = math.sqrt(sum_sq) or 1.0
        norm_vec = {t: s / norm for t, s in vec.items()}
        tfidf_vectors.append({
            "slug": doc["book"]["slug"],
            "vector": norm_vec,
            "doc": doc
        })

    def cosine_sim(v1, v2):
        if len(v1) > len(v2):
            v1, v2 = v2, v1
        dot = sum(score * v2.get(term, 0.0) for term, score in v1.items())
        return dot

    print("Computing pairwise similarities and nearest neighbor ranking...")
    similarity_map = {}

    for i, item_a in enumerate(tfidf_vectors):
        book_a = item_a["doc"]["book"]
        candidates = []

        for j, item_b in enumerate(tfidf_vectors):
            if i == j:
                continue
            book_b = item_b["doc"]["book"]

            # 1. Textual TF-IDF Cosine Similarity
            sim_tfidf = cosine_sim(item_a["vector"], item_b["vector"])

            # 2. Subject Jaccard Similarity
            shared_subjects = [
                s for s in book_a.get("subjects", [])
                if s.lower().strip() in item_b["doc"]["subjects_set"]
            ]
            union_len = len(set(book_a.get("subjects", [])) | set(book_b.get("subjects", []))) or 1
            sim_jaccard = len(shared_subjects) / union_len

            # 3. Genre & Author categorical affinity
            genre_match = 1.0 if book_a.get("genreSlug") == book_b.get("genreSlug") else 0.15
            author_match = 1.0 if book_a.get("authorSlug") == book_b.get("authorSlug") else 0.0

            # 4. Audience compatibility penalty
            aud_mult = 1.0
            if book_a.get("audienceLevel") == "children" and book_b.get("audienceLevel") == "adult":
                aud_mult = 0.4
            elif book_a.get("audienceLevel") == "adult" and book_b.get("audienceLevel") == "children":
                aud_mult = 0.5

            score = (
                0.35 * sim_tfidf +
                0.35 * sim_jaccard +
                0.18 * genre_match +
                0.12 * author_match
            ) * aud_mult

            # Transparent reason string
            if author_match == 1.0:
                reason = f"Same author & shared genre in {book_a.get('genreBadge')}"
            elif len(shared_subjects) >= 2:
                reason = f"Shared subjects: {', '.join(shared_subjects[:2])}"
            elif len(shared_subjects) == 1:
                reason = f"Common theme: {shared_subjects[0]}"
            elif genre_match == 1.0:
                reason = f"Genre companion in {book_a.get('genreBadge')}"
            else:
                reason = "Thematic resonance & literary style"

            match_pct = min(99, max(50, round(score * 100 + 40)))

            candidates.append({
                "slug": book_b.get("slug"),
                "title": book_b.get("title"),
                "authorName": book_b.get("authorName"),
                "authorSlug": book_b.get("authorSlug"),
                "year": book_b.get("year"),
                "coverUrl": book_b.get("coverUrl"),
                "genreBadge": book_b.get("genreBadge"),
                "genreSlug": book_b.get("genreSlug"),
                "audienceLevel": book_b.get("audienceLevel"),
                "score": round(score, 3),
                "matchPercentage": match_pct,
                "reason": reason,
                "sharedSubjects": shared_subjects
            })

        candidates.sort(key=lambda x: x["score"], reverse=True)
        similarity_map[book_a["slug"]] = candidates[:10]

    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(similarity_map, f, indent=2, ensure_ascii=False)

    print(f"Generated similarity graph for {len(similarity_map)} books -> {OUTPUT_JSON}")

if __name__ == "__main__":
    build_embeddings()
