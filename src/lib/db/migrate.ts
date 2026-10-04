import { migrate } from "drizzle-orm/pglite/migrator";
import { db, client } from "./index";
import path from "path";

export async function runMigrations() {
  console.log("Applying database migrations...");
  await client.waitReady;
  try {
    // Attempt to enable pg_trgm and vector extensions
    try {
      await client.exec("CREATE EXTENSION IF NOT EXISTS pg_trgm;");
      console.log("✓ Extension pg_trgm checked/enabled");
    } catch (e) {
      console.log("- pg_trgm note:", (e as Error).message);
    }

    try {
      await client.exec("CREATE EXTENSION IF NOT EXISTS vector;");
      console.log("✓ Extension vector checked/enabled");
    } catch (e) {
      console.log("- vector note:", (e as Error).message);
    }

    const migrationsFolder = path.join(process.cwd(), "drizzle");
    await migrate(db, { migrationsFolder });
    console.log("✓ All migrations successfully applied to PGLite database.");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

// Run directly if invoked via CLI
if (require.main === module || process.argv[1]?.includes("migrate")) {
  runMigrations()
    .then(() => {
      console.log("Migration script complete.");
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
