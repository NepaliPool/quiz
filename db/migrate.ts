import { migrate } from "drizzle-orm/neon-http/migrator";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is no provided in .env");
}

async function runMigration() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const db = drizzle(sql);
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("All migrations ran successfully!");
  } catch (error) {
    console.error("Error migrating: ", error);
    process.exit(1);
  }
}
runMigration();
