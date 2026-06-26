import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(
  new URL("../migrations/0001_create_entries.sql", import.meta.url),
  "utf8",
);
const normalizedMigration = migration.replace(/\s+/g, " ").trim();

assert.match(migration, /CREATE TABLE IF NOT EXISTS entries/i);
assert.match(migration, /\bid\s+TEXT\s+PRIMARY KEY\b/i);
assert.match(
  normalizedMigration,
  /\bcontent TEXT NOT NULL CHECK \(length\(content\) BETWEEN 1 AND 400\)/i,
);
assert.match(
  normalizedMigration,
  /\bmood TEXT NOT NULL CHECK \( mood IN \('happy', 'calm', 'anxious', 'sad', 'tired', 'angry'\) \)/i,
);
assert.match(
  normalizedMigration,
  /\bintensity INTEGER NOT NULL CHECK \(intensity BETWEEN 1 AND 5\)/i,
);
assert.match(normalizedMigration, /\bai_response TEXT\s*,/i);
assert.match(normalizedMigration, /\bcreated_at TEXT NOT NULL\s*,/i);
assert.match(normalizedMigration, /\bupdated_at TEXT NOT NULL\s*\)/i);
assert.match(
  normalizedMigration,
  /CREATE INDEX IF NOT EXISTS idx_entries_created_at ON entries\s*\(created_at DESC\)/i,
);

console.log("schema migration test passed");
