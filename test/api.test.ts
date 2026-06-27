import { env, SELF } from "cloudflare:test";
import { afterEach, expect, vi } from "vitest";
import type { Env } from "../src/types";

const api = (path: string, init?: RequestInit) =>
  SELF.fetch(`https://example.com${path}`, init);

const accessToken = "test-access-token";
const authHeaders = { authorization: `Bearer ${accessToken}` };

function withAuth(init: RequestInit = {}): RequestInit {
  return {
    ...init,
    headers: {
      ...authHeaders,
      ...(init.headers ?? {}),
    },
  };
}

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
    headers: { ...authHeaders, "content-type": "application/json" },
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

afterEach(() => {
  vi.restoreAllMocks();
});

describe("diary entries API", () => {
  it("reports a healthy D1 binding", async () => {
    const response = await api("/api/health");

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ ok: true });
  });

  it("requires a bearer token for diary entries", async () => {
    const response = await api("/api/entries");

    expect(response.status).toBe(401);
    expect(response.headers.get("www-authenticate")).toBe("Bearer");
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  });

  it("rejects an incorrect bearer token for diary entries", async () => {
    const response = await api("/api/entries", {
      headers: { authorization: "Bearer wrong-token" },
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  });

  it("requires a bearer token for AI analysis", async () => {
    const response = await api("/api/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: "今天有点累", mood: "tired" }),
    });

    expect(response.status).toBe(401);
    expect(response.headers.get("www-authenticate")).toBe("Bearer");
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  });

  it("validates AI analysis input", async () => {
    const response = await api("/api/analyze", {
      method: "POST",
      headers: { ...authHeaders, "content-type": "application/json" },
      body: JSON.stringify({ content: " ", mood: "sparkly" }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid analysis request" });
  });

  it("returns a normalized DeepSeek analysis", async () => {
    const deepSeekFetch = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                mood: "calm",
                companion: "我读到了你给自己的呼吸。",
                summary: "你今天整体更接近平静。",
                reason: "你在把事情慢慢放回合适的位置。",
                advice: "今晚可以少安排一点。",
                keywords: "平静、整理、呼吸",
                quote: "行到水穷处，坐看云起时。",
                source: "王维《终南别业》",
                metaphorTitle: "今日意象：月光下的小湖",
                metaphorText: "水面并非没有波纹，只是终于能够照见月亮。",
              }),
            },
          },
        ],
      }),
    } as Response);

    const response = await api("/api/analyze", {
      method: "POST",
      headers: { ...authHeaders, "content-type": "application/json" },
      body: JSON.stringify({ content: "今天终于松了一口气", mood: "calm" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      mood: "calm",
      companion: "我读到了你给自己的呼吸。",
      summary: "你今天整体更接近平静。",
      reason: "你在把事情慢慢放回合适的位置。",
      advice: "今晚可以少安排一点。",
      keywords: "平静、整理、呼吸",
      quote: "行到水穷处，坐看云起时。",
      source: "王维《终南别业》",
      metaphorTitle: "今日意象：月光下的小湖",
      metaphorText: "水面并非没有波纹，只是终于能够照见月亮。",
      planetIndex: 0,
    });
    expect(deepSeekFetch).toHaveBeenCalledWith(
      "https://api.deepseek.com/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          authorization: "Bearer test-deepseek-key",
          "content-type": "application/json",
        }),
      }),
    );

  });

  it("creates a valid entry with a UUID and camelCase fields", async () => {
    const response = await api("/api/entries", {
      method: "POST",
      headers: { ...authHeaders, "content-type": "application/json" },
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

  it("lists only the 50 newest entries in descending creation order", async () => {
    const insert = env.DB.prepare(
      `INSERT INTO entries
        (id, content, mood, intensity, ai_response, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );
    const entries = Array.from({ length: 51 }, (_, index) => {
      const id = `entry-${index.toString().padStart(2, "0")}`;
      const createdAt = new Date(
        Date.UTC(2026, 0, 1, 0, index),
      ).toISOString();
      return insert.bind(
        id,
        `日记 ${index}`,
        "calm",
        3,
        null,
        createdAt,
        createdAt,
      );
    });
    await env.DB.batch(entries);

    const response = await api("/api/entries", withAuth());

    expect(response.status).toBe(200);
    const body = await response.json<Array<Record<string, unknown>>>();
    expect(body).toHaveLength(50);
    expect(body.map((entry) => entry.id)).toEqual(
      Array.from(
        { length: 50 },
        (_, index) => `entry-${(50 - index).toString().padStart(2, "0")}`,
      ),
    );
  });

  it.each([
    [
      "minimum intensity with maximum content and AI response",
      {
        content: "x".repeat(400),
        mood: "calm",
        intensity: 1,
        aiResponse: "y".repeat(2000),
      },
    ],
    [
      "maximum intensity",
      {
        content: "边界",
        mood: "happy",
        intensity: 5,
        aiResponse: null,
      },
    ],
  ])("accepts valid boundaries: %s", async (_name, body) => {
    const response = await api("/api/entries", {
      method: "POST",
      headers: { ...authHeaders, "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject(body);
  });

  it("gets a single entry", async () => {
    const entry = await createEntry();

    const response = await api(`/api/entries/${entry.id}`, withAuth());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(entry);
  });

  it("updates an entry while preserving createdAt", async () => {
    const entry = await createEntry();

    const response = await api(`/api/entries/${entry.id}`, {
      method: "PUT",
      headers: { ...authHeaders, "content-type": "application/json" },
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
      headers: authHeaders,
    });
    expect(removed.status).toBe(204);
    expect(await removed.text()).toBe("");

    const missing = await api(`/api/entries/${entry.id}`, withAuth());
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({ error: "Not found" });
  });

  it.each([
    ["blank content", { ...validInput, content: "   " }],
    ["content over 400 characters", { ...validInput, content: "x".repeat(401) }],
    ["missing content", { mood: "calm", intensity: 3 }],
    ["non-string content", { ...validInput, content: 123 }],
    ["unknown mood", { ...validInput, mood: "excited" }],
    ["missing mood", { content: "正文", intensity: 3 }],
    ["non-string mood", { ...validInput, mood: 123 }],
    ["non-integer intensity", { ...validInput, intensity: 2.5 }],
    ["intensity below range", { ...validInput, intensity: 0 }],
    ["intensity above range", { ...validInput, intensity: 6 }],
    ["missing intensity", { content: "正文", mood: "calm" }],
    ["non-number intensity", { ...validInput, intensity: "3" }],
    [
      "aiResponse over 2000 characters",
      { ...validInput, aiResponse: "x".repeat(2001) },
    ],
    ["non-string aiResponse", { ...validInput, aiResponse: 123 }],
    ["non-object body", []],
  ])(
    "rejects invalid input: %s",
    async (
      _name: string,
      body: Record<string, unknown> | readonly unknown[],
    ) => {
      const response = await api("/api/entries", {
        method: "POST",
        headers: { ...authHeaders, "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "Invalid entry" });
    },
  );

  it("returns 400 rather than 500 for malformed JSON", async () => {
    const response = await api("/api/entries", {
      method: "POST",
      headers: { ...authHeaders, "content-type": "application/json" },
      body: "{",
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid entry" });
  });

  it("returns 404 for missing entries", async () => {
    const response = await api("/api/entries/missing", withAuth());

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
      const response = await api(
        path,
        path.startsWith("/api/entries") ? withAuth({ method }) : { method },
      );

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

  it("serves non-API requests through the ASSETS binding", async () => {
    const request = new Request("https://example.com/");
    const [response, assetResponse] = await Promise.all([
      SELF.fetch(request.clone()),
      (env as Env).ASSETS.fetch(request),
    ]);

    expect(response.status).toBe(assetResponse.status);
    expect(response.headers.get("content-type")).toBe(
      assetResponse.headers.get("content-type"),
    );
    expect(await response.text()).toBe(await assetResponse.text());
  });
});
