const fs = require('fs');
const path = require('path');
const https = require('https');

const booksDir = path.join(__dirname, 'public', 'books');

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

const newBooks = [
  { id: 'sense_and_sensibility', cover_i: '9278292', title: 'Sense and Sensibility' },
  { id: 'beyond_good_and_evil', cover_i: '8245356', title: 'Beyond Good and Evil' },
  { id: 'the_prince', cover_i: '12726168', title: 'The Prince' },
  { id: 'don_quixote', cover_i: '14428305', title: 'Don Quixote' },
  { id: 'voyage_of_the_beagle', cover_i: '12973721', title: 'The Voyage of the Beagle' },
  { id: 'dracula', cover_i: '12216503', title: 'Dracula' },
  { id: 'crime_and_punishment', cover_i: '9411873', title: 'Crime and Punishment' },
  { id: 'the_odyssey', cover_i: '9045853', title: 'The Odyssey' }
];

async function run() {
  for (const b of newBooks) {
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
