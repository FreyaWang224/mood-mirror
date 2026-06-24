CREATE TABLE IF NOT EXISTS entries (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 400),
  mood TEXT NOT NULL CHECK (
    mood IN ('happy', 'calm', 'anxious', 'sad', 'tired', 'angry')
  ),
  intensity INTEGER NOT NULL CHECK (intensity BETWEEN 1 AND 5),
  ai_response TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_entries_created_at
  ON entries (created_at DESC);
