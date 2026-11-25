import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "./schema";
import path from "path";

async function openDatabase() {
  const client = new PGlite(path.join(process.cwd(), ".pglite_data"));
  await client.waitReady;
  return drizzle(client, { schema });
}

const globalForDb = globalThis as typeof globalThis & {
  padhanteDatabase?: ReturnType<typeof openDatabase>;
};

// Route imports also run in build workers. Open the store on the first query.
export function getDatabase() {
  return globalForDb.padhanteDatabase ??= openDatabase().catch((error) => {
    delete globalForDb.padhanteDatabase;
    throw error;
  });
}

export * from "./schema";
