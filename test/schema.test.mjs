import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(
  new URL("../migrations/0001_create_entries.sql", import.meta.url),
  "utf8",
);

assert.match(migration, /CREATE TABLE IF NOT EXISTS entries/i);
assert.match(migration, /\bid\s+TEXT\s+PRIMARY KEY\b/i);

for (const column of [
  "content",
  "mood",
  "intensity",
  "ai_response",
  "created_at",
  "updated_at",
]) {
  assert.match(migration, new RegExp(`\\b${column}\\b`, "i"));
}

assert.match(migration, /\bidx_entries_created_at\b/i);

console.log("schema migration test passed");
