import { env, SELF } from "cloudflare:test";

const api = (path: string, init?: RequestInit) =>
  SELF.fetch(`https://example.com${path}`, init);

const validInput = {
  content: "  今天的风很舒服。  ",
  mood: "calm",
  intensity: 3,
  aiResponse: "允许自己慢一点。",
};

async function createEntry(
  input: Record<string, unknown> = validInput,
): Promise<Record<string, unknown>> {
  const response = await api("/api/entries", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });

  expect(response.status).toBe(201);
  return response.json();
}

beforeEach(async () => {
  await env.DB
    .prepare(
      `CREATE TABLE IF NOT EXISTS entries (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 400),
      mood TEXT NOT NULL CHECK (
        mood IN ('happy', 'calm', 'anxious', 'sad', 'tired', 'angry')
      ),
      intensity INTEGER NOT NULL CHECK (intensity BETWEEN 1 AND 5),
      ai_response TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    )
    .run();
  await env.DB
    .prepare(
      "CREATE INDEX IF NOT EXISTS idx_entries_created_at ON entries (created_at DESC)",
    )
    .run();
  await env.DB.prepare("DELETE FROM entries").run();
});

describe("diary entries API", () => {
  it("reports a healthy D1 binding", async () => {
    const response = await api("/api/health");

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ ok: true });
  });

  it("creates a valid entry with a UUID and camelCase fields", async () => {
    const response = await api("/api/entries", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validInput),
    });

    expect(response.status).toBe(201);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const entry = await response.json<Record<string, unknown>>();
    expect(entry).toMatchObject({
      content: "今天的风很舒服。",
      mood: "calm",
      intensity: 3,
      aiResponse: "允许自己慢一点。",
    });
    expect(entry.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(new Date(entry.createdAt as string).toISOString()).toBe(
      entry.createdAt,
    );
    expect(entry.updatedAt).toBe(entry.createdAt);
  });

  it("lists entries in descending creation order", async () => {
    await env.DB.prepare(
      `INSERT INTO entries
        (id, content, mood, intensity, ai_response, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        "older",
        "较早",
        "sad",
        2,
        null,
        "2026-01-01T00:00:00.000Z",
        "2026-01-01T00:00:00.000Z",
      )
      .run();
    await env.DB.prepare(
      `INSERT INTO entries
        (id, content, mood, intensity, ai_response, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        "newer",
        "较晚",
        "happy",
        5,
        "很好",
        "2026-01-02T00:00:00.000Z",
        "2026-01-02T00:00:00.000Z",
      )
      .run();

    const response = await api("/api/entries");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: "newer",
        content: "较晚",
        mood: "happy",
        intensity: 5,
        aiResponse: "很好",
        createdAt: "2026-01-02T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
      {
        id: "older",
        content: "较早",
        mood: "sad",
        intensity: 2,
        aiResponse: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ]);
  });

  it("gets a single entry", async () => {
    const entry = await createEntry();

    const response = await api(`/api/entries/${entry.id}`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(entry);
  });

  it("updates an entry while preserving createdAt", async () => {
    const entry = await createEntry();

    const response = await api(`/api/entries/${entry.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        content: "  修改后的正文  ",
        mood: "happy",
        intensity: 5,
        aiResponse: null,
      }),
    });

    expect(response.status).toBe(200);
    const updated = await response.json<Record<string, unknown>>();
    expect(updated).toMatchObject({
      id: entry.id,
      content: "修改后的正文",
      mood: "happy",
      intensity: 5,
      aiResponse: null,
      createdAt: entry.createdAt,
    });
    expect(Date.parse(updated.updatedAt as string)).toBeGreaterThanOrEqual(
      Date.parse(entry.updatedAt as string),
    );
  });

  it("deletes an entry and then returns 404", async () => {
    const entry = await createEntry();

    const removed = await api(`/api/entries/${entry.id}`, {
      method: "DELETE",
    });
    expect(removed.status).toBe(204);
    expect(await removed.text()).toBe("");

    const missing = await api(`/api/entries/${entry.id}`);
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({ error: "Not found" });
  });

  it.each([
    ["blank content", { ...validInput, content: "   " }],
    ["content over 400 characters", { ...validInput, content: "x".repeat(401) }],
    ["unknown mood", { ...validInput, mood: "excited" }],
    ["non-integer intensity", { ...validInput, intensity: 2.5 }],
    ["intensity below range", { ...validInput, intensity: 0 }],
    ["intensity above range", { ...validInput, intensity: 6 }],
    [
      "aiResponse over 2000 characters",
      { ...validInput, aiResponse: "x".repeat(2001) },
    ],
    ["non-object body", []],
  ])(
    "rejects invalid input: %s",
    async (
      _name: string,
      body: Record<string, unknown> | readonly unknown[],
    ) => {
      const response = await api("/api/entries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "Invalid entry" });
    },
  );

  it("returns 400 rather than 500 for malformed JSON", async () => {
    const response = await api("/api/entries", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid entry" });
  });

  it("returns 404 for missing entries", async () => {
    const response = await api("/api/entries/missing");

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Not found" });
  });

  it.each([
    ["PUT", "/api/entries"],
    ["DELETE", "/api/entries"],
    ["POST", "/api/entries/some-id"],
    ["PATCH", "/api/entries/some-id"],
    ["POST", "/api/health"],
  ])(
    "returns 405 for unsupported %s %s",
    async (method: string, path: string) => {
      const response = await api(path, { method });

      expect(response.status).toBe(405);
      expect(await response.json()).toEqual({ error: "Method not allowed" });
    },
  );

  it("returns 404 for an unknown API route", async () => {
    const response = await api("/api/unknown");

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Not found" });
  });

  it("returns the JSON 404 response for the API root", async () => {
    const response = await api("/api");

    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(await response.json()).toEqual({ error: "Not found" });
  });
});
