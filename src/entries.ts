import type { Entry, EntryInput, Mood, OwnerId } from "./types";

const moods = new Set<Mood>([
  "happy",
  "calm",
  "anxious",
  "sad",
  "tired",
  "angry",
]);

interface EntryRow {
  id: string;
  owner_id: OwnerId;
  content: string;
  mood: Mood;
  intensity: number;
  ai_response: string | null;
  created_at: string;
  updated_at: string;
}

export class InvalidEntryError extends Error {
  constructor() {
    super("Invalid entry");
  }
}

export class InvalidOwnerError extends Error {
  constructor() {
    super("Invalid owner");
  }
}

export function validateOwnerId(value: unknown): OwnerId {
  if (typeof value !== "string") {
    throw new InvalidOwnerError();
  }

  const ownerId = value.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9_-]{1,39}$/.test(ownerId)) {
    throw new InvalidOwnerError();
  }
  return ownerId;
}

export function validateEntryInput(value: unknown): EntryInput {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new InvalidEntryError();
  }

  const input = value as Record<string, unknown>;
  const content =
    typeof input.content === "string" ? input.content.trim() : null;
  const mood = input.mood;
  const intensity = input.intensity;
  const aiResponse = input.aiResponse;

  if (
    content === null ||
    content.length < 1 ||
    content.length > 400 ||
    typeof mood !== "string" ||
    !moods.has(mood as Mood) ||
    !Number.isInteger(intensity) ||
    (intensity as number) < 1 ||
    (intensity as number) > 5 ||
    !(
      aiResponse === undefined ||
      aiResponse === null ||
      (typeof aiResponse === "string" && aiResponse.length <= 2000)
    )
  ) {
    throw new InvalidEntryError();
  }

  return {
    content,
    mood: mood as Mood,
    intensity: intensity as number,
    aiResponse: aiResponse ?? null,
  };
}

function mapEntry(row: EntryRow): Entry {
  return {
    id: row.id,
    ownerId: row.owner_id,
    content: row.content,
    mood: row.mood,
    intensity: row.intensity,
    aiResponse: row.ai_response,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const selectColumns = `
  SELECT id, owner_id, content, mood, intensity, ai_response, created_at, updated_at
  FROM entries
`;

export async function listEntries(
  db: D1Database,
  ownerId: OwnerId,
): Promise<Entry[]> {
  const result = await db
    .prepare(`${selectColumns} WHERE owner_id = ? ORDER BY created_at DESC LIMIT 50`)
    .bind(ownerId)
    .all<EntryRow>();
  return result.results.map(mapEntry);
}

export async function getEntry(
  db: D1Database,
  ownerId: OwnerId,
  id: string,
): Promise<Entry | null> {
  const row = await db
    .prepare(`${selectColumns} WHERE id = ? AND owner_id = ?`)
    .bind(id, ownerId)
    .first<EntryRow>();
  return row === null ? null : mapEntry(row);
}

export async function createEntry(
  db: D1Database,
  ownerId: OwnerId,
  input: EntryInput,
): Promise<Entry> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO entries
        (id, owner_id, content, mood, intensity, ai_response, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      ownerId,
      input.content,
      input.mood,
      input.intensity,
      input.aiResponse ?? null,
      now,
      now,
    )
    .run();

  return {
    id,
    ownerId,
    content: input.content,
    mood: input.mood,
    intensity: input.intensity,
    aiResponse: input.aiResponse ?? null,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateEntry(
  db: D1Database,
  ownerId: OwnerId,
  id: string,
  input: EntryInput,
): Promise<Entry | null> {
  const updatedAt = new Date().toISOString();
  const result = await db
    .prepare(
      `UPDATE entries
       SET content = ?, mood = ?, intensity = ?, ai_response = ?, updated_at = ?
       WHERE id = ? AND owner_id = ?`,
    )
    .bind(
      input.content,
      input.mood,
      input.intensity,
      input.aiResponse ?? null,
      updatedAt,
      id,
      ownerId,
    )
    .run();

  if (result.meta.changes === 0) {
    return null;
  }

  return getEntry(db, ownerId, id);
}

export async function deleteEntry(
  db: D1Database,
  ownerId: OwnerId,
  id: string,
): Promise<boolean> {
  const result = await db
    .prepare("DELETE FROM entries WHERE id = ? AND owner_id = ?")
    .bind(id, ownerId)
    .run();
  return result.meta.changes > 0;
}
