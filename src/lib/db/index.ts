import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

// Persist data in a local folder '.pglite_data' inside the project directory
// In development, preserve a singleton instance across Next.js HMR reloads
const globalForDb = globalThis as unknown as {
  pgliteClient: PGlite | undefined;
};

const dataDir = path.join(process.cwd(), ".pglite_data");

// Clean stale postmaster.pid if previous process was abruptly killed
const pidFile = path.join(dataDir, "postmaster.pid");
if (fs.existsSync(pidFile)) {
  try {
    fs.unlinkSync(pidFile);
  } catch (_) {}
}

export const client =
  globalForDb.pgliteClient ??
  new PGlite(dataDir);

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgliteClient = client;
}

export const db = drizzle(client, { schema });
export * from "./schema";
