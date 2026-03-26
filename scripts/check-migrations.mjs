import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, "../prisma/migrations");

const entries = fs.readdirSync(migrationsDir, { withFileTypes: true }).filter((entry) => entry.isDirectory());

const missing = [];

for (const entry of entries) {
  const sqlPath = path.join(migrationsDir, entry.name, "migration.sql");
  if (!fs.existsSync(sqlPath)) {
    missing.push(entry.name);
  }
}

if (missing.length > 0) {
  console.error("❌ Missing migration.sql in:", missing.join(", "));
  process.exit(1);
}

console.log("✅ All migrations contain migration.sql.");
