const fs = require('fs');
const path = require('path');
const https = require('https');

const booksDir = path.join(__dirname, 'public', 'books');
if (!fs.existsSync(booksDir)) {
  fs.mkdirSync(booksDir, { recursive: true });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
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

const penguinBooks = [
  { id: 'pride_and_prejudice', cover_i: '14348537', title: 'Pride and Prejudice', genre: 'Romcom', author: 'Jane Austen' },
  { id: 'emma', cover_i: '9278312', title: 'Emma', genre: 'Romcom', author: 'Jane Austen' },
  { id: 'meditations', cover_i: '211529', title: 'Meditations', genre: 'Philosophy', author: 'Marcus Aurelius' },
  { id: 'the_republic', cover_i: '14418448', title: 'The Republic', genre: 'Philosophy', author: 'Plato' },
  { id: 'importance_of_being_earnest', cover_i: '1260453', title: 'The Importance of Being Earnest', genre: 'Comedy', author: 'Oscar Wilde' },
  { id: 'three_men_in_a_boat', cover_i: '8243006', title: 'Three Men in a Boat', genre: 'Comedy', author: 'Jerome K. Jerome' },
  { id: 'frederick_douglass', cover_i: '8247724', title: 'Narrative of Frederick Douglass', genre: 'Documentary', author: 'Frederick Douglass' },
  { id: 'walden', cover_i: '11248037', title: 'Walden', genre: 'Documentary', author: 'Henry David Thoreau' },
  { id: 'frankenstein', cover_i: '12356249', title: 'Frankenstein', genre: 'Fiction', author: 'Mary Shelley' },
  { id: 'great_gatsby', cover_i: '10590366', title: 'The Great Gatsby', genre: 'Fiction', author: 'F. Scott Fitzgerald' },
  { id: 'metamorphosis', cover_i: '12820198', title: 'The Metamorphosis', genre: 'Fiction', author: 'Franz Kafka' },
  { id: 'jane_eyre', cover_i: '8235363', title: 'Jane Eyre', genre: 'Fiction', author: 'Charlotte Brontë' }
];

async function run() {
  for (const b of penguinBooks) {
    const dest = path.join(booksDir, `${b.id}.jpg`);
    const url = `https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg`;
    try {
      console.log(`Downloading ${b.title}...`);
      await download(url, dest);
      console.log(`✓ Saved ${b.id}.jpg (${fs.statSync(dest).size} bytes)`);
    } catch (err) {
      console.error(`✗ Error downloading ${b.title}: ${err.message}`);
    }
  }
}

run();
