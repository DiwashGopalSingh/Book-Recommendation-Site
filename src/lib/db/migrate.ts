import { migrate } from "drizzle-orm/pglite/migrator";
import { db, client } from "./index";
import path from "path";

export async function runMigrations() {
  console.log("Applying database migrations...");
  await client.waitReady;
  try {
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
