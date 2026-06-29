ALTER TABLE entries
  ADD COLUMN owner_id TEXT NOT NULL DEFAULT 'freya'
  CHECK (length(owner_id) BETWEEN 2 AND 40);

CREATE INDEX IF NOT EXISTS idx_entries_owner_created_at
  ON entries (owner_id, created_at DESC);
