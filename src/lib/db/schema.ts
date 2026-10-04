import {
  pgTable,
  text,
  integer,
  real,
  boolean,
  timestamp,
  uuid,
  primaryKey,
  uniqueIndex,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// -------------------------------------------------------------
// 1. Works (The abstract intellectual work)
// -------------------------------------------------------------
export const works = pgTable(
  "works",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    originalLanguage: text("original_language").default("en"),
    firstPublishYear: integer("first_publish_year"),
    description: text("description"),
    descriptionLanguage: text("description_language").default("en"),
    descriptionSource: text("description_source"),
    audienceLevel: text("audience_level", {
      enum: ["children", "teen", "adult", "all", "unknown"],
    })
      .notNull()
      .default("all"),
    qualityScore: real("quality_score").default(1.0),
    status: text("status", {
      enum: ["draft", "published", "hidden"],
    })
      .notNull()
      .default("published"),
    manuallyEdited: boolean("manually_edited").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("works_slug_idx").on(table.slug),
    index("works_audience_idx").on(table.audienceLevel),
    index("works_status_idx").on(table.status),
  ]
);

// -------------------------------------------------------------
// 2. Editions (A concrete physical/digital publication)
// -------------------------------------------------------------
export const editions = pgTable(
  "editions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workId: uuid("work_id")
      .notNull()
      .references(() => works.id, { onDelete: "cascade" }),
    isbn10: text("isbn10"),
    isbn13: text("isbn13"),
    language: text("language").default("en"),
    publisher: text("publisher"),
    publishDate: text("publish_date"),
    pageCount: integer("page_count"),
    format: text("format").default("paperback"), // paperback, hardcover, ebook
    coverUrl: text("cover_url"),
    coverStorageKey: text("cover_storage_key"),
    coverSource: text("cover_source"), // openlibrary, gutenberg, etc.
    coverAttribution: text("cover_attribution"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("editions_work_idx").on(table.workId),
    index("editions_isbn13_idx").on(table.isbn13),
  ]
);

// -------------------------------------------------------------
// 3. Authors
// -------------------------------------------------------------
export const authors = pgTable(
  "authors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    bio: text("bio"),
    bioSource: text("bio_source"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("authors_slug_idx").on(table.slug)]
);

// -------------------------------------------------------------
// 4. Work Authors (Many-to-many junction)
// -------------------------------------------------------------
export const workAuthors = pgTable(
  "work_authors",
  {
    workId: uuid("work_id")
      .notNull()
      .references(() => works.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => authors.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("author"), // author, translator, illustrator
    position: integer("position").notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.workId, table.authorId] }),
    index("work_authors_author_idx").on(table.authorId),
  ]
);

// -------------------------------------------------------------
// 5. Subjects / Genres
// -------------------------------------------------------------
export const subjects = pgTable(
  "subjects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    language: text("language").default("en"),
    normalizedKey: text("normalized_key").notNull().unique(),
  },
  (table) => [uniqueIndex("subjects_key_idx").on(table.normalizedKey)]
);

// -------------------------------------------------------------
// 6. Work Subjects (Many-to-many junction)
// -------------------------------------------------------------
export const workSubjects = pgTable(
  "work_subjects",
  {
    workId: uuid("work_id")
      .notNull()
      .references(() => works.id, { onDelete: "cascade" }),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.workId, table.subjectId] }),
    index("work_subjects_subject_idx").on(table.subjectId),
  ]
);

// -------------------------------------------------------------
// 7. Series & Work Series
// -------------------------------------------------------------
export const series = pgTable("series", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
});

export const workSeries = pgTable(
  "work_series",
  {
    workId: uuid("work_id")
      .notNull()
      .references(() => works.id, { onDelete: "cascade" }),
    seriesId: uuid("series_id")
      .notNull()
      .references(() => series.id, { onDelete: "cascade" }),
    position: real("position"),
  },
  (table) => [primaryKey({ columns: [table.workId, table.seriesId] })]
);

// -------------------------------------------------------------
// 8. External IDs (Traceability & deduplication)
// -------------------------------------------------------------
export const externalIds = pgTable(
  "external_ids",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entityType: text("entity_type").notNull(), // 'work' | 'edition' | 'author'
    entityId: uuid("entity_id").notNull(),
    source: text("source").notNull(), // 'openlibrary' | 'googlebooks' | 'gutenberg'
    externalId: text("external_id").notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    termsNote: text("terms_note"),
  },
  (table) => [
    uniqueIndex("external_ids_source_idx").on(table.source, table.externalId),
    index("external_ids_entity_idx").on(table.entityType, table.entityId),
  ]
);

// -------------------------------------------------------------
// 9. Curated Lists (Staff curated collections)
// -------------------------------------------------------------
export const curatedLists = pgTable(
  "curated_lists",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description"),
    audienceLevel: text("audience_level").default("all"),
    language: text("language").default("en"),
    status: text("status", { enum: ["draft", "published", "archived"] })
      .notNull()
      .default("published"),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("curated_lists_slug_idx").on(table.slug)]
);

export const curatedListItems = pgTable(
  "curated_list_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    listId: uuid("list_id")
      .notNull()
      .references(() => curatedLists.id, { onDelete: "cascade" }),
    workId: uuid("work_id")
      .notNull()
      .references(() => works.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
    note: text("note"), // Staff blurb / curator reason
  },
  (table) => [
    index("curated_list_items_list_idx").on(table.listId),
    index("curated_list_items_work_idx").on(table.workId),
  ]
);

// -------------------------------------------------------------
// 10. Users (Privacy-first: minimal data, no DOB or phone)
// -------------------------------------------------------------
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountType: text("account_type", {
      enum: ["member", "managed", "staff", "admin"],
    })
      .notNull()
      .default("member"),
    displayName: text("display_name").notNull(),
    email: text("email").unique(), // Nullable for managed child accounts
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    passwordHash: text("password_hash"),
    preferredLanguages: jsonb("preferred_languages").$type<string[]>().default(["en"]),
    interfaceLanguage: text("interface_language").default("en"),
    audienceCeiling: text("audience_ceiling", {
      enum: ["children", "teen", "adult", "all"],
    })
      .notNull()
      .default("all"),
    managedBy: uuid("managed_by"),
    status: text("status", { enum: ["active", "disabled", "pending_deletion"] })
      .notNull()
      .default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("users_email_idx").on(table.email),
    index("users_status_idx").on(table.status),
  ]
);

// -------------------------------------------------------------
// 11. User Books (Private Reading Tracker: Shelves & Ratings)
// -------------------------------------------------------------
export const userBooks = pgTable(
  "user_books",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    workId: uuid("work_id")
      .notNull()
      .references(() => works.id, { onDelete: "cascade" }),
    editionId: uuid("edition_id").references(() => editions.id),
    status: text("status", {
      enum: ["want_to_read", "reading", "read", "did_not_finish"],
    }).notNull(),
    rating: real("rating"), // Half-star steps: 0.5 to 5.0
    progressPages: integer("progress_pages"),
    progressPercent: integer("progress_percent"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    privateNote: text("private_note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("user_books_user_work_idx").on(table.userId, table.workId),
    index("user_books_user_status_idx").on(table.userId, table.status),
  ]
);

// -------------------------------------------------------------
// 12. Relations
// -------------------------------------------------------------
export const worksRelations = relations(works, ({ many }) => ({
  editions: many(editions),
  workAuthors: many(workAuthors),
  workSubjects: many(workSubjects),
  workSeries: many(workSeries),
  curatedListItems: many(curatedListItems),
  userBooks: many(userBooks),
}));

export const editionsRelations = relations(editions, ({ one }) => ({
  work: one(works, {
    fields: [editions.workId],
    references: [works.id],
  }),
}));

export const authorsRelations = relations(authors, ({ many }) => ({
  workAuthors: many(workAuthors),
}));

export const workAuthorsRelations = relations(workAuthors, ({ one }) => ({
  work: one(works, {
    fields: [workAuthors.workId],
    references: [works.id],
  }),
  author: one(authors, {
    fields: [workAuthors.authorId],
    references: [authors.id],
  }),
}));

export const subjectsRelations = relations(subjects, ({ many }) => ({
  workSubjects: many(workSubjects),
}));

export const workSubjectsRelations = relations(workSubjects, ({ one }) => ({
  work: one(works, {
    fields: [workSubjects.workId],
    references: [works.id],
  }),
  subject: one(subjects, {
    fields: [workSubjects.subjectId],
    references: [subjects.id],
  }),
}));

export const curatedListsRelations = relations(curatedLists, ({ many }) => ({
  items: many(curatedListItems),
}));

export const curatedListItemsRelations = relations(
  curatedListItems,
  ({ one }) => ({
    list: one(curatedLists, {
      fields: [curatedListItems.listId],
      references: [curatedLists.id],
    }),
    work: one(works, {
      fields: [curatedListItems.workId],
      references: [works.id],
    }),
  })
);

export const usersRelations = relations(users, ({ many }) => ({
  books: many(userBooks),
}));

export const userBooksRelations = relations(userBooks, ({ one }) => ({
  user: one(users, {
    fields: [userBooks.userId],
    references: [users.id],
  }),
  work: one(works, {
    fields: [userBooks.workId],
    references: [works.id],
  }),
  edition: one(editions, {
    fields: [userBooks.editionId],
    references: [editions.id],
  }),
}));
