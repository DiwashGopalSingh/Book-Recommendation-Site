import { db, client, works, editions, authors, workAuthors, subjects, workSubjects, curatedLists, curatedListItems, externalIds } from "./index";
import { runMigrations } from "./migrate";
import { eq } from "drizzle-orm";

interface SeedBook {
  slug: string;
  title: string;
  subtitle?: string;
  authorName: string;
  authorSlug: string;
  authorBio: string;
  year: number;
  language: string;
  pages: number;
  subjects: string[];
  audienceLevel: "children" | "teen" | "adult" | "all";
  coverUrl: string;
  description: string;
  curatorNote: string;
  listSlug: string;
  gutenbergId?: string;
  openLibraryWorkId?: string;
}

const seedBooks: SeedBook[] = [
  {
    slug: "crime-and-punishment",
    title: "Crime and Punishment",
    authorName: "Fyodor Dostoevsky",
    authorSlug: "fyodor-dostoevsky",
    authorBio: "Russian novelist, short story writer, and philosopher whose psychological works explore moral dilemmas in 19th-century Russia.",
    year: 1866,
    language: "en",
    pages: 430,
    subjects: ["Classic Literature", "Psychological Fiction", "Philosophy & Ethics"],
    audienceLevel: "adult",
    coverUrl: "/books/crime-and-punishment.jpg",
    description: "A desperate former student in Saint Petersburg commits a murder to test his theory of moral superiority, only to be consumed by psychological anguish and guilt.",
    curatorNote: "The definitive masterpiece of psychological fiction and moral consequence.",
    listSlug: "staff-picks",
    gutenbergId: "2554",
    openLibraryWorkId: "OL1168007W",
  },
  {
    slug: "pride-and-prejudice",
    title: "Pride and Prejudice",
    authorName: "Jane Austen",
    authorSlug: "jane-austen",
    authorBio: "English novelist known primarily for her six major novels interpreting, critiquing, and commenting upon the British landed gentry.",
    year: 1813,
    language: "en",
    pages: 279,
    subjects: ["Classic Literature", "Romance", "Social Satire"],
    audienceLevel: "all",
    coverUrl: "/books/pride-and-prejudice.jpg",
    description: "The turbulent relationship between Elizabeth Bennet, the daughter of a country gentleman, and Fitzwilliam Darcy, a rich aristocratic landowner.",
    curatorNote: "The sharpest, most sparkling romantic satire in the English language.",
    listSlug: "staff-picks",
    gutenbergId: "1342",
    openLibraryWorkId: "OL66554W",
  },
  {
    slug: "the-great-gatsby",
    title: "The Great Gatsby",
    authorName: "F. Scott Fitzgerald",
    authorSlug: "f-scott-fitzgerald",
    authorBio: "American novelist and short story writer whose works illustrate the flamboyance and excess of the Jazz Age.",
    year: 1925,
    language: "en",
    pages: 180,
    subjects: ["Classic Literature", "Jazz Age", "Tragedy"],
    audienceLevel: "teen",
    coverUrl: "/books/the-great-gatsby.jpg",
    description: "Narrated by Nick Carraway, the novel chronicles the tragic obsession of Jay Gatsby with his former love Daisy Buchanan against the backdrop of Long Island in the Roaring Twenties.",
    curatorNote: "A poetic examination of illusion, wealth, and the elusive American Dream.",
    listSlug: "staff-picks",
    gutenbergId: "64317",
    openLibraryWorkId: "OL103123W",
  },
  {
    slug: "moby-dick",
    title: "Moby Dick",
    subtitle: "Or, The Whale",
    authorName: "Herman Melville",
    authorSlug: "herman-melville",
    authorBio: "American novelist, short story writer, and poet of the American Renaissance period.",
    year: 1851,
    language: "en",
    pages: 635,
    subjects: ["Classic Literature", "Adventure", "Philosophy & Ethics"],
    audienceLevel: "teen",
    coverUrl: "/books/moby-dick.jpg",
    description: "The sailor Ishmael narrates the monomaniacal quest of Captain Ahab for revenge against Moby Dick, the giant white sperm whale that bit off Ahab's leg.",
    curatorNote: "An epic nautical journey questioning fate, obsession, and nature's wild fury.",
    listSlug: "staff-picks",
    gutenbergId: "2701",
    openLibraryWorkId: "OL102749W",
  },
  {
    slug: "1984",
    title: "1984",
    authorName: "George Orwell",
    authorSlug: "george-orwell",
    authorBio: "English novelist, essayist, journalist, and critic whose work is marked by lucid prose and opposition to totalitarianism.",
    year: 1949,
    language: "en",
    pages: 328,
    subjects: ["Dystopian Fiction", "Political Fiction", "Classic Literature"],
    audienceLevel: "teen",
    coverUrl: "/books/1984.jpg",
    description: "In a totalitarian society ruled by the omnipresent Big Brother and the Thought Police, Winston Smith dares to keep a secret diary and fall in love.",
    curatorNote: "An indispensable warning about state surveillance and psychological control.",
    listSlug: "staff-picks",
    openLibraryWorkId: "OL1168083W",
  },
  {
    slug: "the-odyssey",
    title: "The Odyssey",
    authorName: "Homer",
    authorSlug: "homer",
    authorBio: "Ancient Greek poet credited with the authorship of the Iliad and the Odyssey.",
    year: -750,
    language: "en",
    pages: 384,
    subjects: ["Ancient Classics", "Epic Poetry", "Mythology"],
    audienceLevel: "all",
    coverUrl: "/books/the-odyssey.jpg",
    description: "The ten-year perilous voyage of Odysseus, king of Ithaca, as he strives to return home after the fall of Troy to reunite with his wife Penelope.",
    curatorNote: "The foundational epic that established the storytelling grammar of heroism and homecoming.",
    listSlug: "staff-picks",
    gutenbergId: "1727",
    openLibraryWorkId: "OL262410W",
  },
  {
    slug: "frankenstein",
    title: "Frankenstein",
    subtitle: "Or, The Modern Prometheus",
    authorName: "Mary Shelley",
    authorSlug: "mary-shelley",
    authorBio: "English novelist who wrote the Gothic masterpiece Frankenstein, widely regarded as the first true science fiction novel.",
    year: 1818,
    language: "en",
    pages: 280,
    subjects: ["Gothic & Horror", "Classic Literature", "Science Fiction"],
    audienceLevel: "teen",
    coverUrl: "/books/frankenstein.jpg",
    description: "Young scientist Victor Frankenstein creates a sentient creature in an unorthodox scientific experiment, only to abandon his creation with disastrous consequences.",
    curatorNote: "The birth of modern science fiction, blending Gothic horror with profound human sympathy.",
    listSlug: "staff-picks",
    gutenbergId: "84",
    openLibraryWorkId: "OL450061W",
  },
  {
    slug: "dracula",
    title: "Dracula",
    authorName: "Bram Stoker",
    authorSlug: "bram-stoker",
    authorBio: "Irish author celebrated for his 1897 Gothic horror novel Dracula.",
    year: 1897,
    language: "en",
    pages: 418,
    subjects: ["Gothic & Horror", "Classic Literature"],
    audienceLevel: "teen",
    coverUrl: "/books/dracula.jpg",
    description: "Count Dracula's attempt to move from Transylvania to England so that he may find new blood and spread the undead curse, met by Professor Abraham Van Helsing.",
    curatorNote: "The atmospheric epistolary archetype of vampire folklore and Victorian dread.",
    listSlug: "staff-picks",
    gutenbergId: "345",
    openLibraryWorkId: "OL85892W",
  },
  // Philosophy
  {
    slug: "meditations",
    title: "Meditations",
    authorName: "Marcus Aurelius",
    authorSlug: "marcus-aurelius",
    authorBio: "Roman emperor and Stoic philosopher who ruled from 161 to 180 AD.",
    year: 180,
    language: "en",
    pages: 256,
    subjects: ["Philosophy & Ethics", "Stoicism", "Ancient Classics"],
    audienceLevel: "all",
    coverUrl: "/books/meditations.jpg",
    description: "The private journal of the Roman Emperor Marcus Aurelius, recording his reflections on Stoic philosophy, self-discipline, duty, and human nature.",
    curatorNote: "Intimate, unvarnished wisdom from a Roman Emperor on resilience and calm under pressure.",
    listSlug: "philosophy",
    gutenbergId: "2680",
    openLibraryWorkId: "OL132717W",
  },
  {
    slug: "the-republic",
    title: "The Republic",
    authorName: "Plato",
    authorSlug: "plato",
    authorBio: "Ancient Greek philosopher of the Classical period, founder of the Academy in Athens.",
    year: -375,
    language: "en",
    pages: 416,
    subjects: ["Philosophy & Ethics", "Ancient Classics", "Political Philosophy"],
    audienceLevel: "all",
    coverUrl: "/books/the-republic.jpg",
    description: "A Socratic dialogue concerning justice, the order and character of the just city-state, and the just man, famous for the Allegory of the Cave.",
    curatorNote: "The cornerstone of Western political thought and the famous Allegory of the Cave.",
    listSlug: "philosophy",
    gutenbergId: "1497",
    openLibraryWorkId: "OL102717W",
  },
  {
    slug: "beyond-good-and-evil",
    title: "Beyond Good and Evil",
    authorName: "Friedrich Nietzsche",
    authorSlug: "friedrich-nietzsche",
    authorBio: "German philosopher, cultural critic, and philologist whose work has exerted a profound influence on modern intellectual history.",
    year: 1886,
    language: "en",
    pages: 240,
    subjects: ["Philosophy & Ethics", "Existentialism"],
    audienceLevel: "adult",
    coverUrl: "/books/beyond-good-and-evil.jpg",
    description: "Nietzsche dramatically critiques traditional Western morality and philosophy, introducing concepts of will to power and the noble spirit.",
    curatorNote: "A provocative dismantling of dogmatism and traditional moral assumptions.",
    listSlug: "philosophy",
    gutenbergId: "4363",
    openLibraryWorkId: "OL1488118W",
  },
  {
    slug: "the-prince",
    title: "The Prince",
    authorName: "Niccolò Machiavelli",
    authorSlug: "niccolo-machiavelli",
    authorBio: "Italian diplomat, author, philosopher, and historian who lived during the Renaissance.",
    year: 1532,
    language: "en",
    pages: 140,
    subjects: ["Philosophy & Ethics", "Political Philosophy", "Classic Literature"],
    audienceLevel: "teen",
    coverUrl: "/books/the-prince.jpg",
    description: "A 16th-century political treatise offering realistic advice to political leaders on acquiring and maintaining power.",
    curatorNote: "Clear-eyed, controversial realism on statecraft, influence, and leadership.",
    listSlug: "philosophy",
    gutenbergId: "1232",
    openLibraryWorkId: "OL267571W",
  },
  {
    slug: "the-art-of-war",
    title: "The Art of War",
    authorName: "Sun Tzu",
    authorSlug: "sun-tzu",
    authorBio: "Ancient Chinese military general, strategist, and philosopher.",
    year: -500,
    language: "en",
    pages: 112,
    subjects: ["Philosophy & Ethics", "Strategy", "Ancient Classics"],
    audienceLevel: "all",
    coverUrl: "/books/the-art-of-war.jpg",
    description: "An ancient Chinese military treatise attributed to Sun Tzu, devoted to strategy, tactics, deception, and psychological discipline.",
    curatorNote: "Timeless strategic principles on conflict avoidance, discipline, and preparation.",
    listSlug: "philosophy",
    gutenbergId: "132",
    openLibraryWorkId: "OL15682704W",
  },
  // Satire & Adventure
  {
    slug: "alice-in-wonderland",
    title: "Alice's Adventures in Wonderland",
    authorName: "Lewis Carroll",
    authorSlug: "lewis-carroll",
    authorBio: "English author, poet, mathematician, and logician best known for Alice's Adventures in Wonderland.",
    year: 1865,
    language: "en",
    pages: 192,
    subjects: ["Children & Family", "Fantasy", "Satire & Adventure"],
    audienceLevel: "children",
    coverUrl: "/books/alice-in-wonderland.jpg",
    description: "Young Alice falls down a rabbit hole into a subterranean fantasy world populated by peculiar, anthropomorphic creatures.",
    curatorNote: "Pure linguistic play, mathematical wit, and timeless imaginative wonder for all ages.",
    listSlug: "satire-adventure",
    gutenbergId: "11",
    openLibraryWorkId: "OL102713W",
  },
  {
    slug: "don-quixote",
    title: "Don Quixote",
    authorName: "Miguel de Cervantes",
    authorSlug: "miguel-de-cervantes",
    authorBio: "Spanish writer widely regarded as the greatest writer in the Spanish language and one of the world's pre-eminent novelists.",
    year: 1605,
    language: "en",
    pages: 863,
    subjects: ["Classic Literature", "Satire & Adventure", "Humor"],
    audienceLevel: "all",
    coverUrl: "/books/don-quixote.jpg",
    description: "An aging Spanish hidalgo becomes obsessed with tales of chivalry and rides out as a knight-errant accompanied by his faithful squire Sancho Panza.",
    curatorNote: "The first modern novel: a hilarious and deeply touching tribute to idealistic dreamers.",
    listSlug: "satire-adventure",
    gutenbergId: "996",
    openLibraryWorkId: "OL313437W",
  },
  {
    slug: "gullivers-travels",
    title: "Gulliver's Travels",
    authorName: "Jonathan Swift",
    authorSlug: "jonathan-swift",
    authorBio: "Anglo-Irish satirist, essayist, political pamphleteer, poet, and Dean of St Patrick's Cathedral, Dublin.",
    year: 1726,
    language: "en",
    pages: 350,
    subjects: ["Satire & Adventure", "Classic Literature", "Social Satire"],
    audienceLevel: "all",
    coverUrl: "/books/gullivers-travels.jpg",
    description: "Lemuel Gulliver travels to remote nations including Lilliput, Brobdingnag, Laputa, and the land of the Houyhnhnms.",
    curatorNote: "A razor-sharp satire on human vanity, politics, and foolish grandiosity.",
    listSlug: "satire-adventure",
    gutenbergId: "829",
    openLibraryWorkId: "OL21590W",
  },
  {
    slug: "the-adventures-of-huckleberry-finn",
    title: "Adventures of Huckleberry Finn",
    authorName: "Mark Twain",
    authorSlug: "mark-twain",
    authorBio: "American humorist, novelist, and travel writer hailed as the father of American literature.",
    year: 1884,
    language: "en",
    pages: 366,
    subjects: ["Classic Literature", "Satire & Adventure"],
    audienceLevel: "teen",
    coverUrl: "/books/the-adventures-of-huckleberry-finn.jpg",
    description: "Huck Finn fakes his own death and flees down the Mississippi River with the runaway slave Jim, searching for freedom.",
    curatorNote: "Twain's greatest vernacular journey on moral conscience and friendship along the Mississippi.",
    listSlug: "satire-adventure",
    gutenbergId: "76",
    openLibraryWorkId: "OL53919W",
  },
  {
    slug: "the-importance-of-being-earnest",
    title: "The Importance of Being Earnest",
    authorName: "Oscar Wilde",
    authorSlug: "oscar-wilde",
    authorBio: "Irish poet and playwright known for his biting wit, flamboyant dress, and sparkling conversation.",
    year: 1895,
    language: "en",
    pages: 80,
    subjects: ["Satire & Adventure", "Humor", "Plays"],
    audienceLevel: "all",
    coverUrl: "/books/the-importance-of-being-earnest.jpg",
    description: "A farcical comedy in which the protagonists maintain fictitious personas to escape burdensome social obligations in late Victorian London.",
    curatorNote: "The sharpest, wittiest stage dialogue ever penned on social hypocrisies.",
    listSlug: "satire-adventure",
    gutenbergId: "844",
    openLibraryWorkId: "OL1488107W",
  },
  {
    slug: "jane-eyre",
    title: "Jane Eyre",
    authorName: "Charlotte Brontë",
    authorSlug: "charlotte-bronte",
    authorBio: "English novelist and poet, the eldest of the three Brontë sisters who survived into adulthood.",
    year: 1847,
    language: "en",
    pages: 500,
    subjects: ["Classic Literature", "Gothic & Horror", "Romance"],
    audienceLevel: "teen",
    coverUrl: "/books/jane-eyre.jpg",
    description: "An orphaned young woman overcomes cruelty and poverty to become a governess at Thornfield Hall, where she falls in love with the brooding Mr. Rochester.",
    curatorNote: "An unforgettable story of moral integrity, fierce independence, and Gothic mystery.",
    listSlug: "staff-picks",
    gutenbergId: "1260",
    openLibraryWorkId: "OL1488111W",
  },
  {
    slug: "wuthering-heights",
    title: "Wuthering Heights",
    authorName: "Emily Brontë",
    authorSlug: "emily-bronte",
    authorBio: "English novelist and poet who is best known for her only novel, Wuthering Heights.",
    year: 1847,
    language: "en",
    pages: 416,
    subjects: ["Classic Literature", "Gothic & Horror", "Tragedy"],
    audienceLevel: "teen",
    coverUrl: "/books/wuthering-heights.jpg",
    description: "The intense, turbulent, and destructive passion between Heathcliff and Catherine Earnshaw on the windswept Yorkshire moors.",
    curatorNote: "A raw, untamable force of passionate revenge and tragic devotion on the Yorkshire moors.",
    listSlug: "staff-picks",
    gutenbergId: "768",
    openLibraryWorkId: "OL1488112W",
  },
  {
    slug: "the-picture-of-dorian-gray",
    title: "The Picture of Dorian Gray",
    authorName: "Oscar Wilde",
    authorSlug: "oscar-wilde",
    authorBio: "Irish poet and playwright known for his sharp wit, flamboyant style, and philosophical aesthetics.",
    year: 1890,
    language: "en",
    pages: 254,
    subjects: ["Classic Literature", "Gothic & Horror", "Philosophy & Ethics"],
    audienceLevel: "teen",
    coverUrl: "/books/picture-of-dorian-gray.jpg",
    description: "A corrupt young aristocrat maintains his youthful beauty while his painted portrait bears the scars of his sins and decadence.",
    curatorNote: "The seminal philosophical horror story questioning aesthetics, morality, and the consequences of hedonism.",
    listSlug: "staff-picks",
    gutenbergId: "174",
    openLibraryWorkId: "OL1488137W",
  },
  {
    slug: "the-adventures-of-sherlock-holmes",
    title: "The Adventures of Sherlock Holmes",
    authorName: "Arthur Conan Doyle",
    authorSlug: "arthur-conan-doyle",
    authorBio: "British writer and physician who created the legendary consulting detective Sherlock Holmes.",
    year: 1892,
    language: "en",
    pages: 307,
    subjects: ["Classic Literature", "Mystery & Detective", "Crime Fiction"],
    audienceLevel: "all",
    coverUrl: "/books/sherlock-holmes.jpg",
    description: "A collection of twelve detective mysteries solved by Sherlock Holmes and recorded by his loyal companion Dr. John Watson.",
    curatorNote: "The quintessential collection of detective stories featuring Victorian London's brilliant analytical detective.",
    listSlug: "satire-adventure",
    gutenbergId: "1661",
    openLibraryWorkId: "OL262453W",
  },
  {
    slug: "treasure-island",
    title: "Treasure Island",
    authorName: "Robert Louis Stevenson",
    authorSlug: "robert-louis-stevenson",
    authorBio: "Scottish novelist, poet and essayist best known for Treasure Island and Strange Case of Dr Jekyll and Mr Hyde.",
    year: 1883,
    language: "en",
    pages: 292,
    subjects: ["Classic Literature", "Adventure", "Pirates & High Seas"],
    audienceLevel: "all",
    coverUrl: "/books/treasure-island.jpg",
    description: "Young Jim Hawkins discovers a pirate's treasure map and embarks on a perilous voyage challenged by the mutinous Long John Silver.",
    curatorNote: "The definitive pirate adventure that invented modern swashbuckling lore.",
    listSlug: "satire-adventure",
    gutenbergId: "120",
    openLibraryWorkId: "OL24197W",
  },
  {
    slug: "the-time-machine",
    title: "The Time Machine",
    authorName: "H.G. Wells",
    authorSlug: "h-g-wells",
    authorBio: "English writer prolific in many genres, widely acknowledged as the father of science fiction.",
    year: 1895,
    language: "en",
    pages: 118,
    subjects: ["Classic Literature", "Science Fiction", "Dystopian"],
    audienceLevel: "teen",
    coverUrl: "/books/the-time-machine.jpg",
    description: "A Victorian English scientist travels into the far future year 802,701 AD to discover humanity divided into the gentle Eloi and monstrous underground Morlocks.",
    curatorNote: "The landmark novella that coined the phrase 'time machine' and pioneered philosophical science fiction.",
    listSlug: "satire-adventure",
    gutenbergId: "35",
    openLibraryWorkId: "OL103131W",
  },
  {
    slug: "a-tale-of-two-cities",
    title: "A Tale of Two Cities",
    authorName: "Charles Dickens",
    authorSlug: "charles-dickens",
    authorBio: "English writer and social critic who created some of the world's most enduring fictional works.",
    year: 1859,
    language: "en",
    pages: 448,
    subjects: ["Classic Literature", "Historical Fiction", "Tragedy"],
    audienceLevel: "all",
    coverUrl: "/books/tale-of-two-cities.jpg",
    description: "Set against the violent backdrop of the French Revolution, the epic follows Sydney Carton's heroic self-sacrifice for those he loves.",
    curatorNote: "Dickens' sweeping historical epic opening with one of literature's most immortal passages.",
    listSlug: "staff-picks",
    gutenbergId: "98",
    openLibraryWorkId: "OL24198W",
  },
  {
    slug: "war-and-peace",
    title: "War and Peace",
    authorName: "Leo Tolstoy",
    authorSlug: "leo-tolstoy",
    authorBio: "Russian writer universally regarded as one of the greatest authors of all time.",
    year: 1869,
    language: "en",
    pages: 1225,
    subjects: ["Classic Literature", "Historical Fiction", "Philosophy & Ethics"],
    audienceLevel: "adult",
    coverUrl: "/books/war-and-peace.jpg",
    description: "A grand chronicle of five Russian aristocratic families navigating love, society, and destiny amidst Napoleon's 1812 invasion of Russia.",
    curatorNote: "The grandest panoramic novel ever written, fusing personal lives with the philosophy of history.",
    listSlug: "staff-picks",
    gutenbergId: "2600",
    openLibraryWorkId: "OL267098W",
  },
  {
    slug: "little-women",
    title: "Little Women",
    authorName: "Louisa May Alcott",
    authorSlug: "louisa-may-alcott",
    authorBio: "American novelist, short story writer, and poet best known as the author of the novel Little Women.",
    year: 1868,
    language: "en",
    pages: 449,
    subjects: ["Classic Literature", "Family & Society", "Coming of Age"],
    audienceLevel: "all",
    coverUrl: "/books/little-women.jpg",
    description: "The heartwarming and resilient lives of the four March sisters—Meg, Jo, Beth, and Amy—growing up in Civil War-era New England.",
    curatorNote: "A beloved classic of sisterhood, creative ambition, and timeless domestic humor.",
    listSlug: "staff-picks",
    gutenbergId: "514",
    openLibraryWorkId: "OL24199W",
  },
  {
    slug: "sense-and-sensibility",
    title: "Sense and Sensibility",
    authorName: "Jane Austen",
    authorSlug: "jane-austen",
    authorBio: "English novelist celebrated for her sharp wit and enduring portrayals of Regency society.",
    year: 1811,
    language: "en",
    pages: 409,
    subjects: ["Classic Literature", "Romance", "Social Satire"],
    audienceLevel: "all",
    coverUrl: "/books/sense-and-sensibility.jpg",
    description: "Sisters Elinor and Marianne Dashwood represent reason and emotion as they seek love and financial stability after their father's sudden death.",
    curatorNote: "Austen's brilliant debut novel contrasting intellectual moderation with passionate romanticism.",
    listSlug: "staff-picks",
    gutenbergId: "161",
    openLibraryWorkId: "OL66553W",
  },
  {
    slug: "the-metamorphosis",
    title: "The Metamorphosis",
    authorName: "Franz Kafka",
    authorSlug: "franz-kafka",
    authorBio: "German-speaking Bohemian novelist and short-story writer, widely regarded as one of the major figures of 20th-century literature.",
    year: 1915,
    language: "en",
    pages: 100,
    subjects: ["Classic Literature", "Existentialism", "Psychological Fiction"],
    audienceLevel: "adult",
    coverUrl: "/books/metamorphosis.jpg",
    description: "Traveling salesman Gregor Samsa wakes up one morning transformed into a monstrous vermin and struggles to endure his family's horror and abandonment.",
    curatorNote: "A startling, unforgettable existential allegory on modern alienation and familial duty.",
    listSlug: "philosophy",
    gutenbergId: "5200",
    openLibraryWorkId: "OL103130W",
  },
  {
    slug: "narrative-of-the-life-of-frederick-douglass",
    title: "Narrative of the Life of Frederick Douglass",
    authorName: "Frederick Douglass",
    authorSlug: "frederick-douglass",
    authorBio: "American social reformer, abolitionist, orator, writer, and statesman.",
    year: 1845,
    language: "en",
    pages: 144,
    subjects: ["Biography & Memoir", "Philosophy & Ethics", "American History"],
    audienceLevel: "all",
    coverUrl: "/books/frederick-douglass.jpg",
    description: "Douglass's courageous first-person account of his escape from slavery, intellectual awakening, and devotion to freedom and equality.",
    curatorNote: "One of the most powerful and eloquent personal testimonies in American literature.",
    listSlug: "philosophy",
    gutenbergId: "23",
    openLibraryWorkId: "OL267099W",
  },
  {
    slug: "three-men-in-a-boat",
    title: "Three Men in a Boat",
    authorName: "Jerome K. Jerome",
    authorSlug: "jerome-k-jerome",
    authorBio: "English humorist and novelist best known for the comic travelogue Three Men in a Boat.",
    year: 1889,
    language: "en",
    pages: 240,
    subjects: ["Classic Literature", "Comedy & Humor", "Adventure"],
    audienceLevel: "all",
    coverUrl: "/books/three-men-in-a-boat.jpg",
    description: "A humorous account of a two-week boating holiday on the Thames from Kingston upon Thames to Oxford by three friends and their dog Montmorency.",
    curatorNote: "A masterpiece of dry British wit and laugh-out-loud escapades on the River Thames.",
    listSlug: "satire-adventure",
    gutenbergId: "308",
    openLibraryWorkId: "OL267100W",
  },
  {
    slug: "the-voyage-of-the-beagle",
    title: "The Voyage of the Beagle",
    authorName: "Charles Darwin",
    authorSlug: "charles-darwin",
    authorBio: "English naturalist, geologist, and biologist widely known for his contributions to evolutionary biology.",
    year: 1839,
    language: "en",
    pages: 512,
    subjects: ["Science & Nature", "Travel & Exploration", "Natural History"],
    audienceLevel: "all",
    coverUrl: "/books/voyage-of-the-beagle.jpg",
    description: "Darwin's vivid journal of his five-year expedition aboard HMS Beagle, detailing observations in South America and the Galápagos Islands that led to the theory of evolution.",
    curatorNote: "The seminal travelogue of natural observation that revolutionized modern science.",
    listSlug: "satire-adventure",
    gutenbergId: "944",
    openLibraryWorkId: "OL267101W",
  },
  {
    slug: "walden",
    title: "Walden",
    authorName: "Henry David Thoreau",
    authorSlug: "henry-david-thoreau",
    authorBio: "American naturalist, essayist, poet, and philosopher, a leading transcendentalist.",
    year: 1854,
    language: "en",
    pages: 320,
    subjects: ["Philosophy & Ethics", "Nature & Wilderness", "Transcendentalism"],
    audienceLevel: "all",
    coverUrl: "/books/walden.jpg",
    description: "Thoreau's reflection upon simple living in natural surroundings at Walden Pond, exploring self-reliance, solitude, and contemplative harmony with nature.",
    curatorNote: "The timeless manifesto on intentional living, simplicity, and communion with the wilderness.",
    listSlug: "philosophy",
    gutenbergId: "205",
    openLibraryWorkId: "OL267102W",
  },
];

export async function runSeed() {
  await client.waitReady;
  console.log("Seeding authentic community catalog into PGLite...");

  // 1. Create Curated Lists
  const listsToCreate = [
    {
      slug: "staff-picks",
      title: "Staff Picks & Essential Classics",
      description: "Our community librarians' top picks for unforgettable literary depth.",
    },
    {
      slug: "philosophy",
      title: "Timeless Philosophy & Wisdom",
      description: "Centuries of ethical inquiry, Stoic resilience, and strategic clarity.",
    },
    {
      slug: "satire-adventure",
      title: "Wit, Satire & Epic Adventure",
      description: "Hilarious social critiques, whimsical journeys, and timeless humor.",
    },
  ];

  const listIdMap = new Map<string, string>();
  for (const item of listsToCreate) {
    const existing = await db
      .select({ id: curatedLists.id })
      .from(curatedLists)
      .where(eq(curatedLists.slug, item.slug));

    if (existing.length > 0) {
      listIdMap.set(item.slug, existing[0].id);
    } else {
      const [inserted] = await db
        .insert(curatedLists)
        .values({
          slug: item.slug,
          title: item.title,
          description: item.description,
          audienceLevel: "all",
          language: "en",
          status: "published",
        })
        .returning({ id: curatedLists.id });
      listIdMap.set(item.slug, inserted.id);
    }
  }

  // 2. Iterate through seed books
  let count = 0;
  for (const book of seedBooks) {
    // A. Author
    let authorId: string;
    const existingAuthor = await db
      .select({ id: authors.id })
      .from(authors)
      .where(eq(authors.slug, book.authorSlug));

    if (existingAuthor.length > 0) {
      authorId = existingAuthor[0].id;
    } else {
      const [newAuthor] = await db
        .insert(authors)
        .values({
          name: book.authorName,
          slug: book.authorSlug,
          bio: book.authorBio,
          bioSource: "Public Domain Biographical Index",
        })
        .returning({ id: authors.id });
      authorId = newAuthor.id;
    }

    // B. Work
    let workId: string;
    const existingWork = await db
      .select({ id: works.id })
      .from(works)
      .where(eq(works.slug, book.slug));

    if (existingWork.length > 0) {
      workId = existingWork[0].id;
    } else {
      const [newWork] = await db
        .insert(works)
        .values({
          slug: book.slug,
          title: book.title,
          subtitle: book.subtitle,
          originalLanguage: book.language,
          firstPublishYear: book.year,
          description: book.description,
          audienceLevel: book.audienceLevel,
          qualityScore: 1.0,
          status: "published",
        })
        .returning({ id: works.id });
      workId = newWork.id;
    }

    // C. Work-Author junction
    try {
      await db
        .insert(workAuthors)
        .values({
          workId,
          authorId,
          role: "author",
          position: 0,
        })
        .onConflictDoNothing();
    } catch (_) {}

    // D. Subjects & Junctions
    for (const subjName of book.subjects) {
      const normalizedKey = subjName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      let subjId: string;
      const existingSubj = await db
        .select({ id: subjects.id })
        .from(subjects)
        .where(eq(subjects.normalizedKey, normalizedKey));

      if (existingSubj.length > 0) {
        subjId = existingSubj[0].id;
      } else {
        const [newSubj] = await db
          .insert(subjects)
          .values({
            name: subjName,
            language: "en",
            normalizedKey,
          })
          .returning({ id: subjects.id });
        subjId = newSubj.id;
      }

      try {
        await db
          .insert(workSubjects)
          .values({
            workId,
            subjectId: subjId,
          })
          .onConflictDoNothing();
      } catch (_) {}
    }

    // E. Edition (with cover & page count)
    const existingEditions = await db
      .select({ id: editions.id })
      .from(editions)
      .where(eq(editions.workId, workId));

    if (existingEditions.length === 0) {
      await db.insert(editions).values({
        workId,
        pageCount: book.pages,
        format: "paperback",
        coverUrl: book.coverUrl,
        coverSource: "openlibrary_archive",
        coverAttribution: "Public Domain",
        language: "en",
      });
    }

    // F. External IDs (Gutenberg / Open Library)
    if (book.gutenbergId) {
      try {
        await db
          .insert(externalIds)
          .values({
            entityType: "work",
            entityId: workId,
            source: "gutenberg",
            externalId: book.gutenbergId,
            termsNote: "Public Domain, free redistribution under Gutenberg License",
          })
          .onConflictDoNothing();
      } catch (_) {}
    }

    if (book.openLibraryWorkId) {
      try {
        await db
          .insert(externalIds)
          .values({
            entityType: "work",
            entityId: workId,
            source: "openlibrary",
            externalId: book.openLibraryWorkId,
            termsNote: "CC0 / Open Library Metadata",
          })
          .onConflictDoNothing();
      } catch (_) {}
    }

    // G. Curated List Item
    const targetListId = listIdMap.get(book.listSlug);
    if (targetListId) {
      try {
        await db
          .insert(curatedListItems)
          .values({
            listId: targetListId,
            workId,
            position: count,
            note: book.curatorNote,
          });
      } catch (_) {}
    }

    count++;
  }

  console.log(`✓ Seeded ${count} works into the local catalog with authors, editions, subjects, and curated lists.`);
}

// Run if called directly
if (require.main === module || process.argv[1]?.includes("seed")) {
  (async () => {
    await runMigrations();
    await runSeed();
    console.log("Database initialized and seeded successfully!");
    process.exit(0);
  })().catch((err) => {
    console.error("Seed error:", err);
    process.exit(1);
  });
}
