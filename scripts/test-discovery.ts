import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { NextRequest } from "next/server";
import * as schema from "../src/lib/db/schema";
import { issueSession } from "../src/lib/session";
import * as search from "../src/app/api/search/route";
import * as recommendations from "../src/app/api/recommendations/route";

async function checkDiscovery() {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  Object.assign(globalThis, { padhanteDatabase: Promise.resolve(db) });
  try {
    await migrate(db, { migrationsFolder: "drizzle" });
    const find = async (query: string) => {
      const response = await search.GET(new NextRequest("http://localhost/api/search?" + query));
      assert.equal(response.status, 200);
      return response.json();
    };

    const before = await find("q=a&limit=500");
    const [first, second] = await db.insert(schema.works).values([
      { slug: "test-almanac", title: "Test Almanac" },
      { slug: "test-atlas", title: "Test Atlas" },
      { slug: "hidden-almanac", title: "Hidden Almanac", status: "hidden" },
      { slug: "moby-dick", title: "Moby Dick" },
    ]).returning();
    const [topic] = await db.insert(schema.subjects).values({ name: "Rare charts", normalizedKey: "rare-charts" }).returning();
    const [author] = await db.insert(schema.authors).values({ name: "Discovery Test Author", slug: "discovery-test-author" }).returning();
    await db.insert(schema.workAuthors).values({ workId: first.id, authorId: author.id });
    assert.equal((await find("q=Discovery%20Test%20Author")).books[0].slug, first.slug);
    await db.insert(schema.workSubjects).values([first, second].map(work => ({ workId: work.id, subjectId: topic.id })));
    const matches = await find("q=a&limit=500");
    assert.equal(matches.total, before.total + 2);
    assert.equal((await find("q=Moby%20Dick")).total, 1);
    assert.equal((await find("q=Test%20Almanac&subject=Rare%20charts")).total, 1);
    assert.equal((await find("q=Hidden%20Almanac")).total, 0);
    const slugs: string[] = [];
    for (let offset = 0; offset < matches.total; offset += 24) {
      const page = await find("q=a&offset=" + offset);
      slugs.push(...page.books.map((book: { slug: string }) => book.slug));
    }
    assert.deepEqual(slugs, matches.books.map((book: { slug: string }) => book.slug));
    assert.equal(new Set(slugs).size, matches.total);
    assert.ok(slugs.includes("test-almanac") && slugs.includes("test-atlas"));
    assert.equal((await find("q=a&offset=" + matches.total)).books.length, 0);

    const [reader] = await db.insert(schema.users).values({ displayName: "Test reader" }).returning();
    await db.insert(schema.userBooks).values({ userId: reader.id, workId: first.id, status: "read" });
    const headers = { cookie: "cl_session=" + await issueSession(reader.id) };
    const url = "http://localhost/api/recommendations";
    for (const response of [
      await recommendations.GET(new NextRequest(url, { headers })),
      await recommendations.POST(new NextRequest(url, { method: "POST", headers, body: "{}" })),
    ]) {
      assert.equal(response.status, 200);
      const data = await response.json();
      assert.equal(data.isColdStart, false);
      assert.ok(data.recommendations.some((book: { slug: string }) => book.slug === second.slug));
      assert.ok(data.recommendations.every((book: { slug: string }) => book.slug !== first.slug));
    }
    const similar = await recommendations.GET(new NextRequest(url + "?slug=" + first.slug));
    assert.equal((await similar.json()).similar[0].slug, second.slug);
    console.log("Passed catalog, pagination, single-letter search, and recommendation checks.");
  } finally {
    await client.close();
  }
}

checkDiscovery().catch(error => { console.error(error); process.exitCode = 1; });
