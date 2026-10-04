CREATE TABLE "authors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"bio" text,
	"bio_source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "authors_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "curated_list_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"list_id" uuid NOT NULL,
	"work_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "curated_lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"audience_level" text DEFAULT 'all',
	"language" text DEFAULT 'en',
	"status" text DEFAULT 'published' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "curated_lists_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "editions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_id" uuid NOT NULL,
	"isbn10" text,
	"isbn13" text,
	"language" text DEFAULT 'en',
	"publisher" text,
	"publish_date" text,
	"page_count" integer,
	"format" text DEFAULT 'paperback',
	"cover_url" text,
	"cover_storage_key" text,
	"cover_source" text,
	"cover_attribution" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_ids" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"source" text NOT NULL,
	"external_id" text NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"terms_note" text
);
--> statement-breakpoint
CREATE TABLE "series" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"language" text DEFAULT 'en',
	"normalized_key" text NOT NULL,
	CONSTRAINT "subjects_normalized_key_unique" UNIQUE("normalized_key")
);
--> statement-breakpoint
CREATE TABLE "user_books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"work_id" uuid NOT NULL,
	"edition_id" uuid,
	"status" text NOT NULL,
	"rating" real,
	"progress_pages" integer,
	"progress_percent" integer,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"private_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_type" text DEFAULT 'member' NOT NULL,
	"display_name" text NOT NULL,
	"email" text,
	"email_verified_at" timestamp with time zone,
	"password_hash" text,
	"preferred_languages" jsonb DEFAULT '["en"]'::jsonb,
	"interface_language" text DEFAULT 'en',
	"audience_ceiling" text DEFAULT 'all' NOT NULL,
	"managed_by" uuid,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "work_authors" (
	"work_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"role" text DEFAULT 'author' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "work_authors_work_id_author_id_pk" PRIMARY KEY("work_id","author_id")
);
--> statement-breakpoint
CREATE TABLE "work_series" (
	"work_id" uuid NOT NULL,
	"series_id" uuid NOT NULL,
	"position" real,
	CONSTRAINT "work_series_work_id_series_id_pk" PRIMARY KEY("work_id","series_id")
);
--> statement-breakpoint
CREATE TABLE "work_subjects" (
	"work_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	CONSTRAINT "work_subjects_work_id_subject_id_pk" PRIMARY KEY("work_id","subject_id")
);
--> statement-breakpoint
CREATE TABLE "works" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"original_language" text DEFAULT 'en',
	"first_publish_year" integer,
	"description" text,
	"description_language" text DEFAULT 'en',
	"description_source" text,
	"audience_level" text DEFAULT 'all' NOT NULL,
	"quality_score" real DEFAULT 1,
	"status" text DEFAULT 'published' NOT NULL,
	"manually_edited" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "works_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "curated_list_items" ADD CONSTRAINT "curated_list_items_list_id_curated_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."curated_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curated_list_items" ADD CONSTRAINT "curated_list_items_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "editions" ADD CONSTRAINT "editions_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_books" ADD CONSTRAINT "user_books_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_books" ADD CONSTRAINT "user_books_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_books" ADD CONSTRAINT "user_books_edition_id_editions_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."editions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_authors" ADD CONSTRAINT "work_authors_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_authors" ADD CONSTRAINT "work_authors_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_series" ADD CONSTRAINT "work_series_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_series" ADD CONSTRAINT "work_series_series_id_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."series"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_subjects" ADD CONSTRAINT "work_subjects_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_subjects" ADD CONSTRAINT "work_subjects_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "authors_slug_idx" ON "authors" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "curated_list_items_list_idx" ON "curated_list_items" USING btree ("list_id");--> statement-breakpoint
CREATE INDEX "curated_list_items_work_idx" ON "curated_list_items" USING btree ("work_id");--> statement-breakpoint
CREATE UNIQUE INDEX "curated_lists_slug_idx" ON "curated_lists" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "editions_work_idx" ON "editions" USING btree ("work_id");--> statement-breakpoint
CREATE INDEX "editions_isbn13_idx" ON "editions" USING btree ("isbn13");--> statement-breakpoint
CREATE UNIQUE INDEX "external_ids_source_idx" ON "external_ids" USING btree ("source","external_id");--> statement-breakpoint
CREATE INDEX "external_ids_entity_idx" ON "external_ids" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "subjects_key_idx" ON "subjects" USING btree ("normalized_key");--> statement-breakpoint
CREATE UNIQUE INDEX "user_books_user_work_idx" ON "user_books" USING btree ("user_id","work_id");--> statement-breakpoint
CREATE INDEX "user_books_user_status_idx" ON "user_books" USING btree ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_status_idx" ON "users" USING btree ("status");--> statement-breakpoint
CREATE INDEX "work_authors_author_idx" ON "work_authors" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "work_subjects_subject_idx" ON "work_subjects" USING btree ("subject_id");--> statement-breakpoint
CREATE UNIQUE INDEX "works_slug_idx" ON "works" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "works_audience_idx" ON "works" USING btree ("audience_level");--> statement-breakpoint
CREATE INDEX "works_status_idx" ON "works" USING btree ("status");