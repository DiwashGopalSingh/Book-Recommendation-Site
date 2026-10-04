const fs = require('fs');
const path = require('path');

const booksPath = path.join(__dirname, '..', 'src', 'lib', 'catalog', 'books-500.json');
const outputPath = path.join(__dirname, '..', 'src', 'lib', 'catalog', 'book-similarities.json');

const books = JSON.parse(fs.readFileSync(booksPath, 'utf-8'));
console.log(`Loaded ${books.length} books for content similarity matrix generation.`);

// Common English stopwords to ignore in TF-IDF
const STOPWORDS = new Set([
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
]);

function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

// 1. Build Document representations
const documents = books.map((b) => {
  const tokens = [
    ...tokenize(b.title),
    ...tokenize(b.title), // Boost title weight
    ...tokenize(b.authorName),
    ...tokenize(b.authorName), // Boost author weight
    ...b.subjects.flatMap((s) => tokenize(s)).map((t) => [t, t]).flat(), // Boost subject weight
    ...tokenize(b.genre),
    ...tokenize(b.description),
    ...tokenize(b.curatorNote),
  ];

  const termCounts = new Map();
  for (const t of tokens) {
    termCounts.set(t, (termCounts.get(t) || 0) + 1);
  }

  return {
    slug: b.slug,
    book: b,
    termCounts,
    tokensCount: tokens.length,
    subjectsSet: new Set(b.subjects.map((s) => s.toLowerCase().trim())),
  };
});

// 2. Compute Document Frequencies (DF)
const df = new Map();
for (const doc of documents) {
  for (const term of doc.termCounts.keys()) {
    df.set(term, (df.get(term) || 0) + 1);
  }
}

const N = documents.length;

// 3. Compute TF-IDF vectors
const tfidfVectors = documents.map((doc) => {
  const vector = new Map();
  let sumSq = 0;

  for (const [term, count] of doc.termCounts.entries()) {
    const tf = count / doc.tokensCount;
    const idf = Math.log(1 + N / (df.get(term) || 1));
    const score = tf * idf;
    vector.set(term, score);
    sumSq += score * score;
  }

  const norm = Math.sqrt(sumSq) || 1;
  // Normalize vector to unit length
  for (const [term, score] of vector.entries()) {
    vector.set(term, score / norm);
  }

  return { slug: doc.slug, vector, doc };
});

// Fast Cosine similarity between two normalized sparse vectors
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  // Iterate over smaller vector
  const [smaller, larger] = vecA.size < vecB.size ? [vecA, vecB] : [vecB, vecA];
  for (const [term, scoreA] of smaller.entries()) {
    const scoreB = larger.get(term);
    if (scoreB) {
      dotProduct += scoreA * scoreB;
    }
  }
  return dotProduct;
}

// 4. Calculate pairwise similarity for all books
const similarityMap = {};

for (let i = 0; i < tfidfVectors.length; i++) {
  const itemA = tfidfVectors[i];
  const bookA = itemA.doc.book;
  const candidates = [];

  for (let j = 0; j < tfidfVectors.length; j++) {
    if (i === j) continue;
    const itemB = tfidfVectors[j];
    const bookB = itemB.doc.book;

    // Content TF-IDF score [0, 1]
    const tfidfSim = cosineSimilarity(itemA.vector, itemB.vector);

    // Subject Jaccard score [0, 1]
    const sharedSubjects = [];
    for (const subj of bookA.subjects) {
      if (itemB.doc.subjectsSet.has(subj.toLowerCase().trim())) {
        sharedSubjects.push(subj);
      }
    }
    const unionSize = new Set([...bookA.subjects, ...bookB.subjects]).size || 1;
    const jaccardSim = sharedSubjects.length / unionSize;

    // Genre similarity
    const genreMatch = bookA.genreSlug === bookB.genreSlug ? 1.0 : 0.15;

    // Author similarity
    const authorMatch = bookA.authorSlug === bookB.authorSlug ? 1.0 : 0.0;

    // Audience penalty if mismatch
    let audienceMultiplier = 1.0;
    if (bookA.audienceLevel === 'children' && bookB.audienceLevel === 'adult') {
      audienceMultiplier = 0.4;
    } else if (bookA.audienceLevel === 'adult' && bookB.audienceLevel === 'children') {
      audienceMultiplier = 0.5;
    }

    // Composite score
    const compositeScore =
      (0.35 * tfidfSim + 0.35 * jaccardSim + 0.18 * genreMatch + 0.12 * authorMatch) *
      audienceMultiplier;

    // Determine honest, transparent explanation
    let reason = '';
    if (authorMatch === 1.0) {
      reason = `Same author & shared genre in ${bookA.genreBadge}`;
    } else if (sharedSubjects.length >= 2) {
      reason = `Shared subjects: ${sharedSubjects.slice(0, 2).join(', ')}`;
    } else if (sharedSubjects.length === 1) {
      reason = `Common theme: ${sharedSubjects[0]}`;
    } else if (genreMatch === 1.0) {
      reason = `Genre companion in ${bookA.genreBadge}`;
    } else {
      reason = `Thematic resonance & literary style`;
    }

    candidates.push({
      slug: bookB.slug,
      title: bookB.title,
      authorName: bookB.authorName,
      authorSlug: bookB.authorSlug,
      year: bookB.year,
      coverUrl: bookB.coverUrl,
      genreBadge: bookB.genreBadge,
      genreSlug: bookB.genreSlug,
      audienceLevel: bookB.audienceLevel,
      score: Math.round(compositeScore * 1000) / 1000,
      matchPercentage: Math.min(99, Math.max(50, Math.round(compositeScore * 100 + 40))),
      reason,
      sharedSubjects,
    });
  }

  // Sort descending by similarity score, take top 10
  candidates.sort((a, b) => b.score - a.score);
  similarityMap[bookA.slug] = candidates.slice(0, 10);
}

fs.writeFileSync(outputPath, JSON.stringify(similarityMap, null, 2), 'utf-8');
console.log(`Successfully generated similarity graph for ${Object.keys(similarityMap).length} books at ${outputPath}`);
