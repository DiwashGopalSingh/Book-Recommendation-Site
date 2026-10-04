const fs = require('fs');
const path = require('path');
const https = require('https');

const booksDir = path.join(__dirname, 'public', 'books');
if (!fs.existsSync(booksDir)) {
  fs.mkdirSync(booksDir, { recursive: true });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error('Status ' + res.statusCode));
      }
      const fileStream = fs.createWriteStream(dest);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve(true);
      });
    }).on('error', reject);
  });
}

const books = [
  {
    id: 'philosophy',
    title: 'Meditations',
    author: 'Marcus Aurelius',
    genre: 'Philosophy',
    openUrl: 'https://covers.openlibrary.org/b/id/12836246-M.jpg'
  },
  {
    id: 'romcom',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    genre: 'Romcom',
    openUrl: 'https://covers.openlibrary.org/b/id/12645114-M.jpg'
  },
  {
    id: 'comedy',
    title: 'The Importance of Being Earnest',
    author: 'Oscar Wilde',
    genre: 'Comedy',
    openUrl: 'https://covers.openlibrary.org/b/id/8226191-M.jpg'
  },
  {
    id: 'documentary',
    title: 'Narrative of Frederick Douglass',
    author: 'Frederick Douglass',
    genre: 'Documentary',
    openUrl: 'https://covers.openlibrary.org/b/id/8231996-M.jpg'
  },
  {
    id: 'fiction',
    title: 'Frankenstein',
    author: 'Mary Shelley',
    genre: 'Fiction',
    openUrl: 'https://covers.openlibrary.org/b/id/8372652-M.jpg'
  }
];

async function run() {
  for (const b of books) {
    const dest = path.join(booksDir, `${b.id}.jpg`);
    try {
      console.log(`Downloading ${b.title}...`);
      await download(b.openUrl, dest);
      console.log(`✓ Saved ${b.id}.jpg (${fs.statSync(dest).size} bytes)`);
    } catch (err) {
      console.error(`✗ Error downloading ${b.title}: ${err.message}`);
    }
  }
}

run();
